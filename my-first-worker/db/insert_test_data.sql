INSERT INTO shop (id,player,x,y,z,order_type,item_id) VALUES
    (1,'KevinDurantgoat',-42225,67,-35412,'Sell','265'),
    (2,'wavpainter',-42071,66,-35411,'Sell','264'),
    (3,'wavpainter',-41023,45,-23123,'Buy','23');

INSERT INTO cron (timestamp,previous_cron_timestamp) VALUES
    ('2025-03-01T02:16:40.002Z',NULL);
INSERT INTO cron (timestamp,previous_cron_timestamp) VALUES
    ('2025-03-01T03:16:40.002Z','2025-03-01T02:16:40.002Z');

INSERT INTO shop_stock (shop_id,cron_timestamp,quantity,price,stock) VALUES
    (1,'2025-03-01T02:16:40.002Z',4,3.5,1600),
    (1,'2025-03-01T03:16:40.002Z',4,3.0,1500),
    (2,'2025-03-01T02:16:40.002Z',1,12,10),
    (2,'2025-03-01T03:16:40.002Z',1,12,0),
    (3,'2025-03-01T03:16:40.002Z',1,10,20);