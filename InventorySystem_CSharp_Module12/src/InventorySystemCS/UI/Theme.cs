namespace InventorySystemCS.UI;

public static class Theme
{
    public static readonly Color Background = Color.FromArgb(15, 23, 42);
    public static readonly Color Panel = Color.FromArgb(30, 41, 59);
    public static readonly Color Accent = Color.FromArgb(56, 189, 248);
    public static readonly Color AccentDark = Color.FromArgb(2, 132, 199);
    public static readonly Color Text = Color.FromArgb(226, 232, 240);
    public static readonly Color Muted = Color.FromArgb(148, 163, 184);
    public static readonly Color Danger = Color.FromArgb(248, 113, 113);
    public static readonly Font TitleFont = new("Segoe UI", 18, FontStyle.Bold);
    public static readonly Font HeaderFont = new("Segoe UI", 11, FontStyle.Bold);
    public static readonly Font BodyFont = new("Segoe UI", 10, FontStyle.Regular);

    public static Button PrimaryButton(string text)
    {
        return new Button
        {
            Text = text,
            Height = 40,
            FlatStyle = FlatStyle.Flat,
            BackColor = AccentDark,
            ForeColor = Color.White,
            Font = HeaderFont,
            Cursor = Cursors.Hand,
            Margin = new Padding(6)
        };
    }

    public static Label CardLabel(string text, string value)
    {
        return new Label
        {
            Text = $"{text}\n{value}",
            AutoSize = false,
            Dock = DockStyle.Fill,
            ForeColor = Text,
            Font = HeaderFont,
            TextAlign = ContentAlignment.MiddleCenter,
            BackColor = Panel,
            Padding = new Padding(10)
        };
    }
}
