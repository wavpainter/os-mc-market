SELECT A.shop_id, A.quantity, A.price, A.stock,B.shop_id, B.quantity, B.price, B.stock 
FROM shop_stock A 
LEFT JOIN shop_stock B 
ON (A.shop_id,A.prev_timestamp) = (B.shop_id,B.timestamp)
WHERE datetime(A.timestamp) = datetime('2025-03-02T02:19:57.082Z');