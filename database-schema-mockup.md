## Shopper

| uuid   | username | password | is_admin |
|--------|----------|----------|----------|
| abc123 | eggbert  | goat123  | false    |
| efg456 | ibomba   | unc456   | false    |
| adm001 | admin    | goat123  | true     |



## Receipt

|uuid|shopper-uuid|date|store-uuid|
|---|---|---|---|
|abc123|shopper123|11/18/2005|pics456|
|efg456|the_mid456|09/20/2006|market32|


## Item

|uuid|receipt-uuid|name|price|quantity|
|---|---|---|---|---|
|abc123|efg456|Eggs|100|10|
|hij678|klm789|Bacon|10|10|


## Store

|uuid|address|store-chain-uuid|
|---|---|---|
|abc123|7 Oak St|efg456|
|efg456|18 MyGoat Ave|hij789|


## Store Chain

|uuid|name|url|
|---|---|---|
|abc123|Price Chopper|https://www.pricechopper.com/|
|efg456|Market 32|https://www.pricechopper.com/|

