SELECT email, COUNT(*) as count 
FROM user 
GROUP BY email 
HAVING COUNT(*) > 1;
