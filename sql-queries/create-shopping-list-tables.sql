DROP TABLE `Shopping List Item`;
DROP TABLE `Shopping List`;
CREATE TABLE `Shopping List` (
    `uuid` varchar(64) NOT NULL,
    `name` varchar(64) NOT NULL,
    `shopper-uuid` varchar(64) NOT NULL,
    PRIMARY KEY (`uuid`),
    CONSTRAINT SHOPPING_LIST_SHOPPER_FK FOREIGN KEY (`shopper-uuid`) REFERENCES `Shopper`(uuid)
);

CREATE TABLE `Shopping List Item` (
   `uuid` varchar(64) NOT NULL,
   `list-uuid` varchar(64) NOT NULL,
   `name` varchar(64) NOT NULL,
   `quantity` int NOT NULL,
   `category` varchar(64) NOT NULL,
   PRIMARY KEY (`uuid`),
   UNIQUE KEY `uuid_UNIQUE` (`uuid`),
   CONSTRAINT LIST_FK FOREIGN KEY (`list-uuid`) REFERENCES `Shopping List`(uuid)
 );


