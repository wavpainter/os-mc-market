INSERT INTO shop (id,player,x,y,z,order_type,item_id) VALUES
    (1234,'KevinDurantgoat',-42225,4,-35412,'Sell','265'),
    (1235,'wavpainter',-42071,4,-35411,'Sell','264'),
    (1236,'wavpainter',-41023,4,-23123,'Buy','23');

INSERT INTO shop_stock (shop_id,timestamp,prev_timestamp,quantity,price,stock) VALUES
    (1234,'2025-03-02T01:19:57.082Z',NULL,4,3.5,1600),
    (1234,'2025-03-02T02:19:57.082Z','2025-03-02T01:19:57.082Z',4,3.0,1500),
    (1235,'2025-03-02T00:19:57.082Z',NULL,1,12,10),
    (1235,'2025-03-02T02:19:57.082Z','2025-03-02T00:19:57.082Z',1,12,0),
    (1236,'2025-03-02T02:19:57.082Z',NULL,1,10,20);