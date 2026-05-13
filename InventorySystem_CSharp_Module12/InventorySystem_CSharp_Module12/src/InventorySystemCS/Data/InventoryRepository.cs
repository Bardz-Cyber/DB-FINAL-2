using InventorySystemCS.Models;
using Microsoft.Data.Sqlite;
using System.Data;

namespace InventorySystemCS.Data;

public sealed class InventoryRepository
{
    public List<Product> SearchProducts(string keyword = "")
    {
        var products = new List<Product>();
        using var connection = new SqliteConnection(DatabaseInitializer.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = """
        SELECT p.ProductId, p.Sku, p.ProductName, p.CategoryId, c.CategoryName,
               p.SupplierId, s.SupplierName, p.UnitPrice, p.QuantityOnHand, p.ReorderLevel
        FROM Products p
        JOIN Categories c ON c.CategoryId = p.CategoryId
        JOIN Suppliers s ON s.SupplierId = p.SupplierId
        WHERE @keyword = '' OR p.ProductName LIKE @like OR p.Sku LIKE @like OR c.CategoryName LIKE @like
        ORDER BY p.ProductName;
        """;
        command.Parameters.AddWithValue("@keyword", keyword.Trim());
        command.Parameters.AddWithValue("@like", $"%{keyword.Trim()}%");
        using var reader = command.ExecuteReader();
        while (reader.Read())
        {
            products.Add(new Product
            {
                ProductId = reader.GetInt32(0),
                Sku = reader.GetString(1),
                ProductName = reader.GetString(2),
                CategoryId = reader.GetInt32(3),
                CategoryName = reader.GetString(4),
                SupplierId = reader.GetInt32(5),
                SupplierName = reader.GetString(6),
                UnitPrice = reader.GetDecimal(7),
                QuantityOnHand = reader.GetInt32(8),
                ReorderLevel = reader.GetInt32(9)
            });
        }
        return products;
    }

    public void SaveProduct(Product product)
    {
        using var connection = new SqliteConnection(DatabaseInitializer.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        if (product.ProductId == 0)
        {
            command.CommandText = """
            INSERT INTO Products(Sku, ProductName, CategoryId, SupplierId, UnitPrice, QuantityOnHand, ReorderLevel)
            VALUES(@sku, @name, @category, @supplier, @price, @qty, @reorder);
            """;
        }
        else
        {
            command.CommandText = """
            UPDATE Products
            SET Sku=@sku, ProductName=@name, CategoryId=@category, SupplierId=@supplier,
                UnitPrice=@price, QuantityOnHand=@qty, ReorderLevel=@reorder
            WHERE ProductId=@id;
            """;
            command.Parameters.AddWithValue("@id", product.ProductId);
        }
        command.Parameters.AddWithValue("@sku", product.Sku.Trim());
        command.Parameters.AddWithValue("@name", product.ProductName.Trim());
        command.Parameters.AddWithValue("@category", product.CategoryId);
        command.Parameters.AddWithValue("@supplier", product.SupplierId);
        command.Parameters.AddWithValue("@price", product.UnitPrice);
        command.Parameters.AddWithValue("@qty", product.QuantityOnHand);
        command.Parameters.AddWithValue("@reorder", product.ReorderLevel);
        command.ExecuteNonQuery();
    }

    public void DeleteProduct(int productId)
    {
        using var connection = new SqliteConnection(DatabaseInitializer.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = "DELETE FROM Products WHERE ProductId=@id";
        command.Parameters.AddWithValue("@id", productId);
        command.ExecuteNonQuery();
    }

    public void AddStockTransaction(int productId, string type, int quantity, string remarks)
    {
        using var connection = new SqliteConnection(DatabaseInitializer.ConnectionString);
        connection.Open();
        using var transaction = connection.BeginTransaction();
        using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = """
        INSERT INTO StockTransactions(ProductId, TransactionType, Quantity, Remarks)
        VALUES(@product, @type, @quantity, @remarks);
        """;
        command.Parameters.AddWithValue("@product", productId);
        command.Parameters.AddWithValue("@type", type);
        command.Parameters.AddWithValue("@quantity", quantity);
        command.Parameters.AddWithValue("@remarks", remarks);
        command.ExecuteNonQuery();

        using var update = connection.CreateCommand();
        update.Transaction = transaction;
        update.CommandText = type == "IN"
            ? "UPDATE Products SET QuantityOnHand = QuantityOnHand + @quantity WHERE ProductId = @product"
            : "UPDATE Products SET QuantityOnHand = QuantityOnHand - @quantity WHERE ProductId = @product AND QuantityOnHand >= @quantity";
        update.Parameters.AddWithValue("@quantity", quantity);
        update.Parameters.AddWithValue("@product", productId);
        var affected = update.ExecuteNonQuery();
        if (affected == 0)
            throw new InvalidOperationException("Not enough stock available for stock-out transaction.");
        transaction.Commit();
    }

    public DataTable GetTransactionsReport()
    {
        using var connection = new SqliteConnection(DatabaseInitializer.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = """
        SELECT st.TransactionDate AS Date, p.Sku, p.ProductName AS Product,
               st.TransactionType AS Type, st.Quantity, st.Remarks
        FROM StockTransactions st
        JOIN Products p ON p.ProductId = st.ProductId
        ORDER BY st.TransactionDate DESC;
        """;
        using var reader = command.ExecuteReader();
        var table = new DataTable();
        table.Load(reader);
        return table;
    }

    public List<LookupItem> GetCategories() => GetLookup("SELECT CategoryId, CategoryName FROM Categories ORDER BY CategoryName");
    public List<LookupItem> GetSuppliers() => GetLookup("SELECT SupplierId, SupplierName FROM Suppliers ORDER BY SupplierName");

    public (int Products, int LowStock, decimal Value) GetDashboardTotals()
    {
        using var connection = new SqliteConnection(DatabaseInitializer.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = """
        SELECT COUNT(*),
               SUM(CASE WHEN QuantityOnHand <= ReorderLevel THEN 1 ELSE 0 END),
               COALESCE(SUM(UnitPrice * QuantityOnHand), 0)
        FROM Products;
        """;
        using var reader = command.ExecuteReader();
        reader.Read();
        return (reader.GetInt32(0), reader.GetInt32(1), reader.GetDecimal(2));
    }

    private static List<LookupItem> GetLookup(string sql)
    {
        var items = new List<LookupItem>();
        using var connection = new SqliteConnection(DatabaseInitializer.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        using var reader = command.ExecuteReader();
        while (reader.Read())
            items.Add(new LookupItem { Id = reader.GetInt32(0), Name = reader.GetString(1) });
        return items;
    }
}
