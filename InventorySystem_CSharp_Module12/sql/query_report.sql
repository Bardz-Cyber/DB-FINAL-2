-- Query Report for Inventory System

-- 1. Product master list with category and supplier
SELECT p.Sku, p.ProductName, c.CategoryName, s.SupplierName, p.UnitPrice, p.QuantityOnHand
FROM Products p
JOIN Categories c ON c.CategoryId = p.CategoryId
JOIN Suppliers s ON s.SupplierId = p.SupplierId
ORDER BY p.ProductName;

-- 2. Low stock report
SELECT Sku, ProductName, QuantityOnHand, ReorderLevel
FROM Products
WHERE QuantityOnHand <= ReorderLevel
ORDER BY QuantityOnHand ASC;

-- 3. Inventory valuation
SELECT p.Sku, p.ProductName, p.QuantityOnHand, p.UnitPrice,
       p.QuantityOnHand * p.UnitPrice AS InventoryValue
FROM Products p
ORDER BY InventoryValue DESC;

-- 4. Stock movement history
SELECT st.TransactionDate, p.Sku, p.ProductName, st.TransactionType, st.Quantity, st.Remarks
FROM StockTransactions st
JOIN Products p ON p.ProductId = st.ProductId
ORDER BY st.TransactionDate DESC;

-- 5. Count products per category
SELECT c.CategoryName, COUNT(p.ProductId) AS TotalProducts
FROM Categories c
LEFT JOIN Products p ON p.CategoryId = c.CategoryId
GROUP BY c.CategoryId, c.CategoryName;
