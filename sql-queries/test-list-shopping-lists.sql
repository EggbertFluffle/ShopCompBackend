SELECT * FROM `Shopping List`;
SELECT * FROM `Shopping List Item`;
SELECT * FROM Shopper;
-- INSERT INTO Shopper VALUES ('3ffdc011-2c74-4d25-9f5f-9006cc6d102c', 'catmajor', 'ilovefemboys', 1)
-- INSERT INTO `Shopping List` VALUES('77a57584-9d67-4552-9e27-30a95dfee84a', 'Fun List', '3ffdc011-2c74-4d25-9f5f-9006cc6d102c')
--INSERT INTO `Shopping List Item` VALUES('bb1fa1b2-2495-41cc-a6e4-2e3ea7a81327', '77a57584-9d67-4552-9e27-30a95dfee84a', 'Vodka 1L', '3', 'Fun')
SELECT
  `Shopping List`.uuid AS list_uuid,
  `Shopping List`.name AS list_name,
  `Shopping List Item`.uuid AS item_uuid,
  `Shopping List Item`.name AS item_name,
  `Shopping List Item`.quantity AS item_quantity
FROM `Shopping List`
LEFT JOIN `Shopping List Item` 
  ON `Shopping List`.uuid = `Shopping List Item`.`list-uuid`
WHERE `Shopping List`.`shopper-uuid` = '3ffdc011-2c74-4d25-9f5f-9006cc6d102c'
ORDER BY `Shopping List`.name;

