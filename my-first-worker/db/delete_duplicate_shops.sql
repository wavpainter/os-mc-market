DELETE FROM shop
WHERE id IN(
    SELECT A.id AS id
    FROM shop A 
    INNER JOIN shop B 
    ON (A.player,A.item_id,A.order_type,A.y) = (B.player,B.item_id,B.order_type,B.y) 
        AND (A.x = (B.x+1) OR A.z = (B.z + 1))
);

DELETE FROM shop_stock
WHERE shop_id IN(
    SELECT A.id AS id
    FROM shop A 
    INNER JOIN shop B 
    ON (A.player,A.item_id,A.order_type,A.y) = (B.player,B.item_id,B.order_type,B.y) 
        AND (A.x = (B.x+1) OR A.z = (B.z + 1))
);