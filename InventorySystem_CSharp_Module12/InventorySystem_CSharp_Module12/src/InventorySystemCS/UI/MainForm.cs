using InventorySystemCS.Data;
using InventorySystemCS.Models;
using System.Data;

namespace InventorySystemCS.UI;

public sealed class MainForm : Form
{
    private readonly InventoryRepository _repository = new();
    private readonly TextBox _searchBox = new();
    private readonly DataGridView _grid = new();
    private readonly FlowLayoutPanel _cards = new();

    public MainForm()
    {
        Text = "Inventory Management System - C#";
        WindowState = FormWindowState.Maximized;
        MinimumSize = new Size(1100, 720);
        BackColor = Theme.Background;
        ForeColor = Theme.Text;
        Font = Theme.BodyFont;
        BuildLayout();
        RefreshData();
    }

    private void BuildLayout()
    {
        var root = new TableLayoutPanel { Dock = DockStyle.Fill, RowCount = 4, Padding = new Padding(22) };
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 70));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 115));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 62));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Controls.Add(root);

        var title = new Label
        {
            Text = "Inventory Management System",
            Dock = DockStyle.Fill,
            Font = Theme.TitleFont,
            ForeColor = Theme.Text,
            TextAlign = ContentAlignment.MiddleLeft
        };
        root.Controls.Add(title, 0, 0);

        _cards.Dock = DockStyle.Fill;
        _cards.Padding = new Padding(0, 5, 0, 5);
        root.Controls.Add(_cards, 0, 1);

        var toolbar = new FlowLayoutPanel { Dock = DockStyle.Fill, FlowDirection = FlowDirection.LeftToRight };
        _searchBox.Width = 280;
        _searchBox.Height = 34;
        _searchBox.PlaceholderText = "Search product, SKU, or category...";
        _searchBox.TextChanged += (_, _) => RefreshData();
        toolbar.Controls.Add(_searchBox);

        var add = Theme.PrimaryButton("+ Add Product"); add.Click += (_, _) => OpenProductForm(null);
        var edit = Theme.PrimaryButton("Edit Selected"); edit.Click += (_, _) => EditSelected();
        var del = Theme.PrimaryButton("Delete"); del.BackColor = Theme.Danger; del.Click += (_, _) => DeleteSelected();
        var stock = Theme.PrimaryButton("Stock In / Out"); stock.Click += (_, _) => StockSelected();
        var report = Theme.PrimaryButton("Transactions Report"); report.Click += (_, _) => ShowReport();
        toolbar.Controls.Add(add); toolbar.Controls.Add(edit); toolbar.Controls.Add(stock); toolbar.Controls.Add(del); toolbar.Controls.Add(report);
        root.Controls.Add(toolbar, 0, 2);

        _grid.Dock = DockStyle.Fill;
        _grid.BackgroundColor = Theme.Panel;
        _grid.BorderStyle = BorderStyle.None;
        _grid.ReadOnly = true;
        _grid.AllowUserToAddRows = false;
        _grid.AllowUserToDeleteRows = false;
        _grid.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
        _grid.SelectionMode = DataGridViewSelectionMode.FullRowSelect;
        _grid.MultiSelect = false;
        _grid.EnableHeadersVisualStyles = false;
        _grid.ColumnHeadersDefaultCellStyle.BackColor = Theme.AccentDark;
        _grid.ColumnHeadersDefaultCellStyle.ForeColor = Color.White;
        _grid.ColumnHeadersDefaultCellStyle.Font = Theme.HeaderFont;
        _grid.DefaultCellStyle.BackColor = Theme.Panel;
        _grid.DefaultCellStyle.ForeColor = Theme.Text;
        _grid.DefaultCellStyle.SelectionBackColor = Theme.AccentDark;
        _grid.DefaultCellStyle.SelectionForeColor = Color.White;
        _grid.RowHeadersVisible = false;
        root.Controls.Add(_grid, 0, 3);
    }

    private void RefreshData()
    {
        var products = _repository.SearchProducts(_searchBox.Text);
        _grid.DataSource = products;
        if (_grid.Columns.Count > 0)
        {
            _grid.Columns[nameof(Product.ProductId)].Visible = false;
            _grid.Columns[nameof(Product.CategoryId)].Visible = false;
            _grid.Columns[nameof(Product.SupplierId)].Visible = false;
            _grid.Columns[nameof(Product.UnitPrice)].DefaultCellStyle.Format = "C2";
        }
        RefreshCards();
    }

    private void RefreshCards()
    {
        _cards.Controls.Clear();
        var totals = _repository.GetDashboardTotals();
        AddCard("Total Products", totals.Products.ToString());
        AddCard("Low Stock Items", totals.LowStock.ToString());
        AddCard("Inventory Value", totals.Value.ToString("C2"));
    }

    private void AddCard(string title, string value)
    {
        var panel = new Panel { Width = 260, Height = 90, BackColor = Theme.Panel, Margin = new Padding(0, 0, 18, 0), Padding = new Padding(10) };
        panel.Controls.Add(Theme.CardLabel(title, value));
        _cards.Controls.Add(panel);
    }

    private Product? SelectedProduct() => _grid.CurrentRow?.DataBoundItem as Product;

    private void OpenProductForm(Product? product)
    {
        using var form = new ProductForm(product);
        if (form.ShowDialog(this) == DialogResult.OK) RefreshData();
    }

    private void EditSelected()
    {
        var product = SelectedProduct();
        if (product == null) return;
        OpenProductForm(product);
    }

    private void DeleteSelected()
    {
        var product = SelectedProduct();
        if (product == null) return;
        if (MessageBox.Show($"Delete {product.ProductName}?", "Confirm Delete", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
        {
            _repository.DeleteProduct(product.ProductId);
            RefreshData();
        }
    }

    private void StockSelected()
    {
        var product = SelectedProduct();
        if (product == null) return;
        using var form = new StockForm(product);
        if (form.ShowDialog(this) == DialogResult.OK) RefreshData();
    }

    private void ShowReport()
    {
        var table = _repository.GetTransactionsReport();
        var report = new Form { Text = "Stock Transactions Report", Size = new Size(900, 520), StartPosition = FormStartPosition.CenterParent, BackColor = Theme.Background };
        var grid = new DataGridView
        {
            Dock = DockStyle.Fill,
            DataSource = table,
            ReadOnly = true,
            AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill,
            BackgroundColor = Theme.Panel,
            ForeColor = Theme.Text,
            AllowUserToAddRows = false
        };
        report.Controls.Add(grid);
        report.ShowDialog(this);
    }
}
