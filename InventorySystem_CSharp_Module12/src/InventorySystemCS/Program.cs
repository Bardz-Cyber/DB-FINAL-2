using InventorySystemCS.Data;
using InventorySystemCS.UI;

namespace InventorySystemCS;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        ApplicationConfiguration.Initialize();
        DatabaseInitializer.Initialize();
        Application.Run(new MainForm());
    }
}
