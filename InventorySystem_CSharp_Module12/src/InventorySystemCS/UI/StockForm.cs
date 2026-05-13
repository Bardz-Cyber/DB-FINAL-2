using InventorySystemCS.Data;
using InventorySystemCS.Models;

namespace InventorySystemCS.UI;

public sealed class StockForm : Form
{
    private readonly InventoryRepository _repository = new();
    private readonly Product _product;
    private readonly ComboBox _type = new();
    private readonly NumericUpDown _quantity = new();
    private readonly TextBox _remarks = new();

    public StockForm(Product product)
    {
        _product = product;
        Text = "Stock Transaction";
        StartPosition = FormStartPosition.CenterParent;
        Size = new Size(440, 330);
        BackColor = Theme.Background;
        ForeColor = Theme.Text;
        Font = Theme.BodyFont;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        BuildLayout();
    }

    private void BuildLayout()
    {
        var root = new TableLayoutPanel { Dock = DockStyle.Fill, Padding = new Padding(22), RowCount = 6, ColumnCount = 2 };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 35));
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 65));
        Controls.Add(root);

        root.Controls.Add(new Label { Text = "Product", ForeColor = Theme.Muted, Dock = DockStyle.Fill });
        root.Controls.Add(new Label { Text = $"{_product.Sku} - {_product.ProductName}", ForeColor = Theme.Text, Dock = DockStyle.Fill, Font = Theme.HeaderFont });
        _type.Items.AddRange(new[] { "IN", "OUT" }); _type.SelectedIndex = 0; _type.Dock = DockStyle.Fill;
        _quantity.Minimum = 1; _quantity.Maximum = 99999; _quantity.Value = 1; _quantity.Dock = DockStyle.Fill;
        _remarks.Dock = DockStyle.Fill;
        AddRow(root, "Type", _type);
        AddRow(root, "Quantity", _quantity);
        AddRow(root, "Remarks", _remarks);

        var save = Theme.PrimaryButton("Save Transaction");
        save.Click += (_, _) => Save();
        var cancel = Theme.PrimaryButton("Cancel");
        cancel.BackColor = Theme.Panel;
        cancel.Click += (_, _) => DialogResult = DialogResult.Cancel;
        root.Controls.Add(save, 0, 5);
        root.Controls.Add(cancel, 1, 5);
    }

    private static void AddRow(TableLayoutPanel root, string label, Control input)
    {
        root.Controls.Add(new Label { Text = label, Dock = DockStyle.Fill, TextAlign = ContentAlignment.MiddleLeft, ForeColor = Theme.Muted });
        input.Font = Theme.BodyFont;
        input.Margin = new Padding(4, 6, 4, 6);
        root.Controls.Add(input);
    }

    private void Save()
    {
        try
        {
            _repository.AddStockTransaction(_product.ProductId, _type.Text, (int)_quantity.Value, _remarks.Text);
            DialogResult = DialogResult.OK;
        }
        catch (Exception ex)
        {
            MessageBox.Show(ex.Message, "Transaction Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
