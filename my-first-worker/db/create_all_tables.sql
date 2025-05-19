/* Shop */
CREATE TABLE IF NOT EXISTS shop (
    id INTEGER NOT NULL,
    player TEXT NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    z INTEGER NOT NULL,
    order_type TEXT NOT NULL,
    item_id TEXT NOT NULL,
    UNIQUE (player,x,y,z,order_type,item_id),
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_shop_player ON shop(player);
CREATE INDEX IF NOT EXISTS idx_shop_x ON shop(x);
CREATE INDEX IF NOT EXISTS idx_shop_y ON shop(y);
CREATE INDEX IF NOT EXISTS idx_shop_z ON shop(z);
CREATE INDEX IF NOT EXISTS idx_shop_ordertype ON shop(order_type);
CREATE INDEX IF NOT EXISTS idx_shop_itemid ON shop(item_id);

/* Shop Stock */
CREATE TABLE IF NOT EXISTS shop_stock (
    shop_id INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    prev_timestamp INTEGER NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    stock INTEGER NOT NULL,
    FOREIGN KEY (shop_id) REFERENCES shop(id),
    FOREIGN KEY (shop_id, prev_timestamp) REFERENCES shop_stock (shop_id,timestamp),
    PRIMARY KEY (shop_id, timestamp)
);

/*CREATE INDEX IF NOT EXISTS idx_shopstock_shopid ON shop_stock(shop_id);
CREATE INDEX IF NOT EXISTS idx_shopstock_timestamp ON shop_stock(timestamp);
CREATE INDEX IF NOT EXISTS idx_shopstock_prevtimestamp ON shop_stock(prev_timestamp);*/