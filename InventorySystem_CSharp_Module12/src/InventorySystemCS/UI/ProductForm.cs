using InventorySystemCS.Data;
using InventorySystemCS.Models;

namespace InventorySystemCS.UI;

public sealed class ProductForm : Form
{
    private readonly InventoryRepository _repository = new();
    private readonly Product _product;
    private readonly TextBox _sku = new();
    private readonly TextBox _name = new();
    private readonly ComboBox _category = new();
    private readonly ComboBox _supplier = new();
    private readonly NumericUpDown _price = new();
    private readonly NumericUpDown _qty = new();
    private readonly NumericUpDown _reorder = new();

    public ProductForm(Product? product = null)
    {
        _product = product ?? new Product();
        Text = product == null ? "Add Product" : "Edit Product";
        StartPosition = FormStartPosition.CenterParent;
        Size = new Size(520, 520);
        BackColor = Theme.Background;
        ForeColor = Theme.Text;
        Font = Theme.BodyFont;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        BuildLayout();
        LoadLookups();
        LoadProduct();
    }

    private void BuildLayout()
    {
        var root = new TableLayoutPanel { Dock = DockStyle.Fill, Padding = new Padding(22), RowCount = 9, ColumnCount = 2 };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 32));
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 68));
        Controls.Add(root);

        AddRow(root, "SKU", _sku);
        AddRow(root, "Product Name", _name);
        AddRow(root, "Category", _category);
        AddRow(root, "Supplier", _supplier);
        _price.Maximum = 999999; _price.DecimalPlaces = 2; _price.ThousandsSeparator = true;
        _qty.Maximum = 100000; _reorder.Maximum = 100000;
        AddRow(root, "Unit Price", _price);
        AddRow(root, "Quantity", _qty);
        AddRow(root, "Reorder Level", _reorder);

        var save = Theme.PrimaryButton("Save Product");
        save.Click += Save_Click;
        var cancel = Theme.PrimaryButton("Cancel");
        cancel.BackColor = Theme.Panel;
        cancel.Click += (_, _) => DialogResult = DialogResult.Cancel;
        root.Controls.Add(save, 0, 7);
        root.Controls.Add(cancel, 1, 7);
    }

    private static void AddRow(TableLayoutPanel root, string label, Control input)
    {
        var lbl = new Label { Text = label, Dock = DockStyle.Fill, TextAlign = ContentAlignment.MiddleLeft, ForeColor = Theme.Muted };
        input.Dock = DockStyle.Fill;
        input.Margin = new Padding(4, 6, 4, 6);
        input.Font = Theme.BodyFont;
        root.Controls.Add(lbl);
        root.Controls.Add(input);
    }

    private void LoadLookups()
    {
        _category.DataSource = _repository.GetCategories();
        _category.DisplayMember = "Name"; _category.ValueMember = "Id";
        _supplier.DataSource = _repository.GetSuppliers();
        _supplier.DisplayMember = "Name"; _supplier.ValueMember = "Id";
    }

    private void LoadProduct()
    {
        _sku.Text = _product.Sku;
        _name.Text = _product.ProductName;
        _price.Value = _product.UnitPrice;
        _qty.Value = _product.QuantityOnHand;
        _reorder.Value = _product.ReorderLevel == 0 ? 5 : _product.ReorderLevel;
        if (_product.CategoryId > 0) _category.SelectedValue = _product.CategoryId;
        if (_product.SupplierId > 0) _supplier.SelectedValue = _product.SupplierId;
    }

    private void Save_Click(object? sender, EventArgs e)
    {
        if (string.IsNullOrWhiteSpace(_sku.Text) || string.IsNullOrWhiteSpace(_name.Text))
        {
            MessageBox.Show("SKU and Product Name are required.", "Validation", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }
        _product.Sku = _sku.Text;
        _product.ProductName = _name.Text;
        _product.CategoryId = (int)_category.SelectedValue;
        _product.SupplierId = (int)_supplier.SelectedValue;
        _product.UnitPrice = _price.Value;
        _product.QuantityOnHand = (int)_qty.Value;
        _product.ReorderLevel = (int)_reorder.Value;
        _repository.SaveProduct(_product);
        DialogResult = DialogResult.OK;
    }
}
