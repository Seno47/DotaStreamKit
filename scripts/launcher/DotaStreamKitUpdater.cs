using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Threading;

internal static class DotaStreamKitUpdater
{
    private static int Main(string[] args)
    {
        string appRoot = GetArg(args, "--app-root");
        string downloadUrl = GetArg(args, "--download-url");
        string version = GetArg(args, "--version");
        string assetName = GetArg(args, "--asset-name");
        int pid = ParseInt(GetArg(args, "--pid"));

        if (string.IsNullOrWhiteSpace(appRoot) || string.IsNullOrWhiteSpace(downloadUrl))
        {
            Console.Error.WriteLine("Missing update arguments.");
            return 1;
        }

        string installRoot = Path.GetFullPath(Path.Combine(appRoot, ".."));
        string tempRoot = Path.Combine(Path.GetTempPath(), "DotaStreamKit-update-" + Guid.NewGuid().ToString("N"));
        string archivePath = Path.Combine(tempRoot, string.IsNullOrWhiteSpace(assetName) ? "update.zip" : assetName);

        try
        {
            Console.Title = "DotaStreamKit Updater";
            Console.WriteLine("Updating DotaStreamKit to " + version);
            Console.WriteLine("Downloading release asset...");
            Directory.CreateDirectory(tempRoot);

            using (WebClient client = new WebClient())
            {
                client.Headers.Add("User-Agent", "DotaStreamKitUpdater/" + version);
                client.DownloadFile(downloadUrl, archivePath);
            }

            WaitForProcessExit(pid, 30000);

            string extractDir = Path.Combine(tempRoot, "extract");
            ZipFile.ExtractToDirectory(archivePath, extractDir);
            string releaseRoot = FindReleaseRoot(extractDir);
            if (releaseRoot == null) throw new Exception("Could not find extracted DotaStreamKit release.");

            Console.WriteLine("Installing files...");
            CopyDirectory(Path.Combine(releaseRoot, "app"), Path.Combine(installRoot, "app"));
            CopyDirectory(Path.Combine(releaseRoot, "runtime"), Path.Combine(installRoot, "runtime"));
            CopyFileIfExists(Path.Combine(releaseRoot, "DotaStreamKit.exe"), Path.Combine(installRoot, "DotaStreamKit.exe"));
            CopyFileIfExists(Path.Combine(releaseRoot, "DotaStreamKitUpdater.exe"), Path.Combine(installRoot, "DotaStreamKitUpdater.exe"));

            Console.WriteLine("Starting DotaStreamKit...");
            Process.Start(new ProcessStartInfo(Path.Combine(installRoot, "DotaStreamKit.exe")) { UseShellExecute = true });
            return 0;
        }
        catch (Exception error)
        {
            Console.Error.WriteLine("Update failed: " + error.Message);
            Console.Error.WriteLine("Press Enter to close.");
            Console.ReadLine();
            return 1;
        }
        finally
        {
            try { Directory.Delete(tempRoot, true); } catch { }
        }
    }

    private static string GetArg(string[] args, string name)
    {
        for (int i = 0; i < args.Length - 1; i++)
        {
            if (string.Equals(args[i], name, StringComparison.OrdinalIgnoreCase)) return args[i + 1];
        }
        return "";
    }

    private static int ParseInt(string value)
    {
        int parsed;
        return int.TryParse(value, out parsed) ? parsed : 0;
    }

    private static void WaitForProcessExit(int pid, int timeoutMs)
    {
        if (pid <= 0) return;
        try
        {
            Process process = Process.GetProcessById(pid);
            process.WaitForExit(timeoutMs);
        }
        catch { }
    }

    private static string FindReleaseRoot(string extractDir)
    {
        foreach (string dir in Directory.GetDirectories(extractDir, "DotaStreamKit-*", SearchOption.TopDirectoryOnly))
        {
            if (Directory.Exists(Path.Combine(dir, "app")) && Directory.Exists(Path.Combine(dir, "runtime"))) return dir;
        }
        if (Directory.Exists(Path.Combine(extractDir, "app")) && Directory.Exists(Path.Combine(extractDir, "runtime"))) return extractDir;
        return null;
    }

    private static void CopyDirectory(string source, string target)
    {
        if (!Directory.Exists(source)) throw new DirectoryNotFoundException(source);
        Directory.CreateDirectory(target);
        foreach (string file in Directory.GetFiles(source, "*", SearchOption.AllDirectories))
        {
            string relative = file.Substring(source.Length).TrimStart(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            string destination = Path.Combine(target, relative);
            Directory.CreateDirectory(Path.GetDirectoryName(destination));
            File.Copy(file, destination, true);
        }
    }

    private static void CopyFileIfExists(string source, string target)
    {
        if (!File.Exists(source)) return;
        Directory.CreateDirectory(Path.GetDirectoryName(target));
        File.Copy(source, target, true);
    }
}
