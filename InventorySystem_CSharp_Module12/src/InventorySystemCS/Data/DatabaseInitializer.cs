using Microsoft.Data.Sqlite;

namespace InventorySystemCS.Data;

public static class DatabaseInitializer
{
    public static string DatabasePath => Path.Combine(AppContext.BaseDirectory, "inventory.db");
    public static string ConnectionString => $"Data Source={DatabasePath}";

    public static void Initialize()
    {
        using var connection = new SqliteConnection(ConnectionString);
        connection.Open();

        Execute(connection, "PRAGMA foreign_keys = ON;");
        Execute(connection, SchemaSql);
        SeedData(connection);
    }

    private static void Execute(SqliteConnection connection, string sql)
    {
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.ExecuteNonQuery();
    }

    private static void SeedData(SqliteConnection connection)
    {
        Execute(connection, """
        INSERT OR IGNORE INTO Categories(CategoryId, CategoryName, Description) VALUES
        (1, 'Electronics', 'Devices and accessories'),
        (2, 'Office Supplies', 'Paper, pens, folders, and desk items'),
        (3, 'Food Items', 'Packaged food and beverages');

        INSERT OR IGNORE INTO Suppliers(SupplierId, SupplierName, ContactPerson, Phone, Email) VALUES
        (1, 'TechSource Trading', 'Mia Santos', '0917-111-2222', 'sales@techsource.test'),
        (2, 'OfficePro Cebu', 'Leo Reyes', '0918-333-4444', 'orders@officepro.test'),
        (3, 'Daily Goods Supply', 'Ana Cruz', '0919-555-6666', 'hello@dailygoods.test');

        INSERT OR IGNORE INTO Products(ProductId, Sku, ProductName, CategoryId, SupplierId, UnitPrice, QuantityOnHand, ReorderLevel) VALUES
        (1, 'EL-USB-001', 'USB Flash Drive 32GB', 1, 1, 280.00, 35, 10),
        (2, 'EL-MSE-002', 'Wireless Mouse', 1, 1, 450.00, 8, 12),
        (3, 'OF-BND-003', 'Bond Paper A4 Ream', 2, 2, 245.00, 50, 15),
        (4, 'OF-PEN-004', 'Black Ballpen Box', 2, 2, 120.00, 5, 10),
        (5, 'FD-WTR-005', 'Bottled Water 500ml Case', 3, 3, 210.00, 20, 8);

        INSERT OR IGNORE INTO Customers(CustomerId, CustomerName, Phone, Email) VALUES
        (1, 'Walk-in Customer', '', ''),
        (2, 'ABC School', '032-888-1010', 'purchasing@abcschool.test');
        """);
    }

    private const string SchemaSql = """
    CREATE TABLE IF NOT EXISTS Categories (
        CategoryId INTEGER PRIMARY KEY AUTOINCREMENT,
        CategoryName TEXT NOT NULL UNIQUE,
        Description TEXT
    );

    CREATE TABLE IF NOT EXISTS Suppliers (
        SupplierId INTEGER PRIMARY KEY AUTOINCREMENT,
        SupplierName TEXT NOT NULL,
        ContactPerson TEXT,
        Phone TEXT,
        Email TEXT
    );

    CREATE TABLE IF NOT EXISTS Products (
        ProductId INTEGER PRIMARY KEY AUTOINCREMENT,
        Sku TEXT NOT NULL UNIQUE,
        ProductName TEXT NOT NULL,
        CategoryId INTEGER NOT NULL,
        SupplierId INTEGER NOT NULL,
        UnitPrice NUMERIC NOT NULL CHECK(UnitPrice >= 0),
        QuantityOnHand INTEGER NOT NULL DEFAULT 0 CHECK(QuantityOnHand >= 0),
        ReorderLevel INTEGER NOT NULL DEFAULT 5 CHECK(ReorderLevel >= 0),
        CreatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(CategoryId) REFERENCES Categories(CategoryId),
        FOREIGN KEY(SupplierId) REFERENCES Suppliers(SupplierId)
    );

    CREATE TABLE IF NOT EXISTS Customers (
        CustomerId INTEGER PRIMARY KEY AUTOINCREMENT,
        CustomerName TEXT NOT NULL,
        Phone TEXT,
        Email TEXT
    );

    CREATE TABLE IF NOT EXISTS StockTransactions (
        TransactionId INTEGER PRIMARY KEY AUTOINCREMENT,
        ProductId INTEGER NOT NULL,
        TransactionType TEXT NOT NULL CHECK(TransactionType IN ('IN', 'OUT')),
        Quantity INTEGER NOT NULL CHECK(Quantity > 0),
        Remarks TEXT,
        TransactionDate TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(ProductId) REFERENCES Products(ProductId)
    );

    CREATE TABLE IF NOT EXISTS SalesOrders (
        SalesOrderId INTEGER PRIMARY KEY AUTOINCREMENT,
        CustomerId INTEGER NOT NULL,
        OrderDate TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        TotalAmount NUMERIC NOT NULL DEFAULT 0,
        FOREIGN KEY(CustomerId) REFERENCES Customers(CustomerId)
    );

    CREATE TABLE IF NOT EXISTS SalesOrderItems (
        SalesOrderItemId INTEGER PRIMARY KEY AUTOINCREMENT,
        SalesOrderId INTEGER NOT NULL,
        ProductId INTEGER NOT NULL,
        Quantity INTEGER NOT NULL CHECK(Quantity > 0),
        UnitPrice NUMERIC NOT NULL CHECK(UnitPrice >= 0),
        LineTotal NUMERIC GENERATED ALWAYS AS (Quantity * UnitPrice) STORED,
        FOREIGN KEY(SalesOrderId) REFERENCES SalesOrders(SalesOrderId),
        FOREIGN KEY(ProductId) REFERENCES Products(ProductId)
    );
    """;
}
