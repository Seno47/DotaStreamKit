using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;

internal static class DotaStreamKitLauncher
{
    private const string LocalUrl = "http://localhost:37273";

    private static int Main()
    {
        string root = AppDomain.CurrentDomain.BaseDirectory;
        string nodePath = Path.Combine(root, "runtime", "node.exe");
        string serverPath = Path.Combine(root, "app", "src", "server.js");
        string appDir = Path.Combine(root, "app");

        if (!File.Exists(nodePath))
        {
            Console.Error.WriteLine("Missing runtime\\node.exe");
            return 1;
        }

        if (!File.Exists(serverPath))
        {
            Console.Error.WriteLine("Missing app\\src\\server.js");
            return 1;
        }

        Console.Title = "DotaStreamKit";
        Console.WriteLine("Starting DotaStreamKit...");
        Console.WriteLine("Dashboard: " + LocalUrl);
        Console.WriteLine("OBS overlay: " + LocalUrl + "/overlay.html");
        Console.WriteLine();
        Console.WriteLine("Keep this window open while streaming. Close it to stop DotaStreamKit.");
        Console.WriteLine();

        using (Process server = new Process())
        {
            server.StartInfo.FileName = nodePath;
            server.StartInfo.Arguments = Quote(serverPath);
            server.StartInfo.WorkingDirectory = appDir;
            server.StartInfo.UseShellExecute = false;
            server.StartInfo.RedirectStandardOutput = false;
            server.StartInfo.RedirectStandardError = false;
            server.StartInfo.CreateNoWindow = false;
            server.StartInfo.EnvironmentVariables["DOTASTREAMKIT_LAUNCHER"] = "1";

            try
            {
                server.Start();
            }
            catch (Exception error)
            {
                Console.Error.WriteLine("Failed to start DotaStreamKit: " + error.Message);
                return 1;
            }

            if (WaitForDashboard(15000))
            {
                OpenBrowser(LocalUrl);
            }
            else
            {
                Console.WriteLine("Dashboard did not respond yet. Open manually: " + LocalUrl);
            }

            server.WaitForExit();
            return server.ExitCode;
        }
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
        catch
        {
            Console.WriteLine("Open manually: " + url);
        }
    }

    private static string Quote(string value)
    {
        return "\"" + value.Replace("\"", "\\\"") + "\"";
    }
}
