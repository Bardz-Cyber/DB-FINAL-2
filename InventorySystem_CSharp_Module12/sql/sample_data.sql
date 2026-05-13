-- Sample Data
INSERT INTO Categories(CategoryName, Description) VALUES
('Electronics', 'Devices and accessories'),
('Office Supplies', 'Paper, pens, folders, and desk items'),
('Food Items', 'Packaged food and beverages');

INSERT INTO Suppliers(SupplierName, ContactPerson, Phone, Email) VALUES
('TechSource Trading', 'Mia Santos', '0917-111-2222', 'sales@techsource.test'),
('OfficePro Cebu', 'Leo Reyes', '0918-333-4444', 'orders@officepro.test'),
('Daily Goods Supply', 'Ana Cruz', '0919-555-6666', 'hello@dailygoods.test');

INSERT INTO Products(Sku, ProductName, CategoryId, SupplierId, UnitPrice, QuantityOnHand, ReorderLevel) VALUES
('EL-USB-001', 'USB Flash Drive 32GB', 1, 1, 280.00, 35, 10),
('EL-MSE-002', 'Wireless Mouse', 1, 1, 450.00, 8, 12),
('OF-BND-003', 'Bond Paper A4 Ream', 2, 2, 245.00, 50, 15),
('OF-PEN-004', 'Black Ballpen Box', 2, 2, 120.00, 5, 10),
('FD-WTR-005', 'Bottled Water 500ml Case', 3, 3, 210.00, 20, 8);

INSERT INTO Customers(CustomerName, Phone, Email) VALUES
('Walk-in Customer', '', ''),
('ABC School', '032-888-1010', 'purchasing@abcschool.test');
