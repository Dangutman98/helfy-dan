#!/bin/sh

until curl -s http://connect:8083/connectors >/dev/null; do
    sleep 2
done

echo "Registering MySQL connector..."
while true; do
    response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
      -H "Content-Type: application/json" \
      --data @/mysql-connector.json \
      http://connect:8083/connectors)
      
    if [ "$response" = "201" ] || [ "$response" = "409" ]; then
        echo "Connector registered successfully (status: $response)"
        break
    fi
    echo "Failed to register connector (status: $response). Retrying in 5 seconds..."
    sleep 5
done
