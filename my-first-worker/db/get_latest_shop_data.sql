SELECT s.*, ss.timestamp,ss.prev_timestamp,ss.quantity,ss.price,ss.stock
FROM shop s
LEFT JOIN
    (SELECT A.* 
    FROM shop_stock A 
    INNER JOIN 
        (SELECT shop_id, MAX(timestamp) AS timestamp 
        FROM shop_stock 
        GROUP BY shop_id) B 
    ON A.shop_id = B.shop_id AND A.timestamp = B.timestamp) ss
ON s.id = ss.shop_id;