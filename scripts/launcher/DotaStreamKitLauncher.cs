using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;

internal static class DotaStreamKitLauncher
{
    [STAThread]
    private static int Main()
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        using (LauncherForm form = new LauncherForm())
        {
            Application.Run(form);
            return form.ExitCode;
        }
    }
}

internal sealed class LauncherForm : Form
{
    private const string LocalUrl = "http://localhost:37273";

    private readonly Label statusLabel;
    private readonly TextBox logBox;
    private readonly Button dashboardButton;
    private readonly Button overlayButton;
    private readonly Button stopButton;
    private Process server;
    private bool stopping;

    public int ExitCode { get; private set; }

    public LauncherForm()
    {
        Text = "DotaStreamKit";
        StartPosition = FormStartPosition.CenterScreen;
        MinimumSize = new Size(620, 420);
        Size = new Size(760, 520);
        Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);

        TableLayoutPanel layout = new TableLayoutPanel();
        layout.Dock = DockStyle.Fill;
        layout.ColumnCount = 1;
        layout.RowCount = 4;
        layout.Padding = new Padding(14);
        layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Controls.Add(layout);

        Label title = new Label();
        title.Text = "DotaStreamKit is starting";
        title.Font = new Font(Font.FontFamily, 13, FontStyle.Bold);
        title.AutoSize = true;
        layout.Controls.Add(title, 0, 0);

        FlowLayoutPanel buttons = new FlowLayoutPanel();
        buttons.AutoSize = true;
        buttons.Dock = DockStyle.Fill;
        buttons.Padding = new Padding(0, 10, 0, 10);
        layout.Controls.Add(buttons, 0, 1);

        dashboardButton = new Button();
        dashboardButton.Text = "Dashboard";
        dashboardButton.Width = 120;
        dashboardButton.Enabled = false;
        dashboardButton.Click += delegate { OpenBrowser(LocalUrl); };
        buttons.Controls.Add(dashboardButton);

        overlayButton = new Button();
        overlayButton.Text = "OBS overlay";
        overlayButton.Width = 120;
        overlayButton.Enabled = false;
        overlayButton.Click += delegate { OpenBrowser(LocalUrl + "/overlay.html"); };
        buttons.Controls.Add(overlayButton);

        stopButton = new Button();
        stopButton.Text = "Stop";
        stopButton.Width = 120;
        stopButton.Click += delegate { Close(); };
        buttons.Controls.Add(stopButton);

        logBox = new TextBox();
        logBox.Dock = DockStyle.Fill;
        logBox.Multiline = true;
        logBox.ReadOnly = true;
        logBox.ScrollBars = ScrollBars.Vertical;
        logBox.Font = new Font("Consolas", 9);
        layout.Controls.Add(logBox, 0, 2);

        statusLabel = new Label();
        statusLabel.Text = "Starting local server...";
        statusLabel.AutoSize = true;
        statusLabel.Padding = new Padding(0, 10, 0, 0);
        layout.Controls.Add(statusLabel, 0, 3);

        Shown += delegate { StartServer(); };
        FormClosing += OnFormClosing;
    }

    private void StartServer()
    {
        string root = AppDomain.CurrentDomain.BaseDirectory;
        string nodePath = Path.Combine(root, "runtime", "node.exe");
        string serverPath = Path.Combine(root, "app", "src", "server.js");
        string appDir = Path.Combine(root, "app");
        string dataDir = ResolveDataDir(root);

        AppendLog("Starting DotaStreamKit...");
        AppendLog("Dashboard: " + LocalUrl);
        AppendLog("OBS overlay: " + LocalUrl + "/overlay.html");
        if (!string.IsNullOrWhiteSpace(dataDir)) AppendLog("Data: " + dataDir);
        AppendLog("");

        if (!File.Exists(nodePath))
        {
            Fail("Missing runtime\\node.exe");
            return;
        }

        if (!File.Exists(serverPath))
        {
            Fail("Missing app\\src\\server.js");
            return;
        }

        server = new Process();
        server.StartInfo.FileName = nodePath;
        server.StartInfo.Arguments = Quote(serverPath);
        server.StartInfo.WorkingDirectory = appDir;
        server.StartInfo.UseShellExecute = false;
        server.StartInfo.RedirectStandardOutput = true;
        server.StartInfo.RedirectStandardError = true;
        server.StartInfo.CreateNoWindow = true;
        server.StartInfo.EnvironmentVariables["DOTASTREAMKIT_LAUNCHER"] = "1";
        if (!string.IsNullOrWhiteSpace(dataDir)) server.StartInfo.EnvironmentVariables["DOTASTREAMKIT_DATA_DIR"] = dataDir;
        server.EnableRaisingEvents = true;
        server.OutputDataReceived += delegate(object sender, DataReceivedEventArgs args) { if (args.Data != null) AppendLog(args.Data); };
        server.ErrorDataReceived += delegate(object sender, DataReceivedEventArgs args) { if (args.Data != null) AppendLog(args.Data); };
        server.Exited += delegate
        {
            ExitCode = server.ExitCode;
            BeginInvoke((Action)delegate
            {
                statusLabel.Text = stopping ? "Stopped." : "DotaStreamKit stopped. Exit code: " + ExitCode;
                stopButton.Text = "Close";
            });
        };

        try
        {
            server.Start();
            server.BeginOutputReadLine();
            server.BeginErrorReadLine();
        }
        catch (Exception error)
        {
            Fail("Failed to start DotaStreamKit: " + error.Message);
            return;
        }

        Thread waitThread = new Thread(new ThreadStart(delegate
        {
            if (WaitForDashboard(15000))
            {
                BeginInvoke((Action)delegate
                {
                    statusLabel.Text = "Running. Keep this window open while streaming.";
                    dashboardButton.Enabled = true;
                    overlayButton.Enabled = true;
                });
                if (Environment.GetEnvironmentVariable("DOTASTREAMKIT_NO_BROWSER") != "1") OpenBrowser(LocalUrl);
            }
            else
            {
                BeginInvoke((Action)delegate
                {
                    statusLabel.Text = "Dashboard did not respond yet. You can keep waiting or restart.";
                    dashboardButton.Enabled = true;
                    overlayButton.Enabled = true;
                });
            }
        }));
        waitThread.IsBackground = true;
        waitThread.Start();
    }

    private static string ResolveDataDir(string installRoot)
    {
        string explicitDataDir = Environment.GetEnvironmentVariable("DOTASTREAMKIT_DATA_DIR");
        if (!string.IsNullOrWhiteSpace(explicitDataDir)) return explicitDataDir;

        if (File.Exists(Path.Combine(installRoot, "unins000.exe")) || IsInsideProtectedInstallDir(installRoot))
        {
            string baseDir = Environment.GetEnvironmentVariable("APPDATA");
            if (string.IsNullOrWhiteSpace(baseDir)) baseDir = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            if (!string.IsNullOrWhiteSpace(baseDir)) return Path.Combine(baseDir, "DotaStreamKit");
        }

        return "";
    }

    private static bool IsInsideProtectedInstallDir(string path)
    {
        string fullPath = Path.GetFullPath(path).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        string[] roots = new string[]
        {
            Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
            Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86)
        };
        foreach (string root in roots)
        {
            if (string.IsNullOrWhiteSpace(root)) continue;
            string fullRoot = Path.GetFullPath(root).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            if (fullPath.Equals(fullRoot, StringComparison.OrdinalIgnoreCase)) return true;
            if (fullPath.StartsWith(fullRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)) return true;
        }
        return false;
    }

    private void Fail(string message)
    {
        ExitCode = 1;
        AppendLog(message);
        statusLabel.Text = message;
        stopButton.Text = "Close";
    }

    private void OnFormClosing(object sender, FormClosingEventArgs args)
    {
        stopping = true;
        if (server == null || server.HasExited) return;
        try
        {
            server.Kill();
            server.WaitForExit(5000);
        }
        catch { }
    }

    private void AppendLog(string line)
    {
        if (IsDisposed) return;
        if (InvokeRequired)
        {
            BeginInvoke((Action<string>)AppendLog, line);
            return;
        }
        logBox.AppendText(line + Environment.NewLine);
    }

    private static bool WaitForDashboard(int timeoutMs)
    {
        Stopwatch watch = Stopwatch.StartNew();
        while (watch.ElapsedMilliseconds < timeoutMs)
        {
            try
            {
                HttpWebRequest request = (HttpWebRequest)WebRequest.Create(LocalUrl + "/api/state");
                request.Method = "GET";
                request.Timeout = 1000;
                using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
                {
                    if ((int)response.StatusCode >= 200 && (int)response.StatusCode < 500) return true;
                }
            }
            catch
            {
                Thread.Sleep(500);
            }
        }
        return false;
    }

    private static void OpenBrowser(string url)
    {
        try
        {
            Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
        }
        catch { }
    }

    private static string Quote(string value)
    {
        return "\"" + value.Replace("\"", "\\\"") + "\"";
    }
}
