-- Inventory Management System - SQLite Schema
PRAGMA foreign_keys = ON;

CREATE TABLE Categories (
    CategoryId INTEGER PRIMARY KEY AUTOINCREMENT,
    CategoryName TEXT NOT NULL UNIQUE,
    Description TEXT
);

CREATE TABLE Suppliers (
    SupplierId INTEGER PRIMARY KEY AUTOINCREMENT,
    SupplierName TEXT NOT NULL,
    ContactPerson TEXT,
    Phone TEXT,
    Email TEXT
);

CREATE TABLE Products (
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

CREATE TABLE Customers (
    CustomerId INTEGER PRIMARY KEY AUTOINCREMENT,
    CustomerName TEXT NOT NULL,
    Phone TEXT,
    Email TEXT
);

CREATE TABLE StockTransactions (
    TransactionId INTEGER PRIMARY KEY AUTOINCREMENT,
    ProductId INTEGER NOT NULL,
    TransactionType TEXT NOT NULL CHECK(TransactionType IN ('IN', 'OUT')),
    Quantity INTEGER NOT NULL CHECK(Quantity > 0),
    Remarks TEXT,
    TransactionDate TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ProductId) REFERENCES Products(ProductId)
);

CREATE TABLE SalesOrders (
    SalesOrderId INTEGER PRIMARY KEY AUTOINCREMENT,
    CustomerId INTEGER NOT NULL,
    OrderDate TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TotalAmount NUMERIC NOT NULL DEFAULT 0,
    FOREIGN KEY(CustomerId) REFERENCES Customers(CustomerId)
);

CREATE TABLE SalesOrderItems (
    SalesOrderItemId INTEGER PRIMARY KEY AUTOINCREMENT,
    SalesOrderId INTEGER NOT NULL,
    ProductId INTEGER NOT NULL,
    Quantity INTEGER NOT NULL CHECK(Quantity > 0),
    UnitPrice NUMERIC NOT NULL CHECK(UnitPrice >= 0),
    LineTotal NUMERIC GENERATED ALWAYS AS (Quantity * UnitPrice) STORED,
    FOREIGN KEY(SalesOrderId) REFERENCES SalesOrders(SalesOrderId),
    FOREIGN KEY(ProductId) REFERENCES Products(ProductId)
);
