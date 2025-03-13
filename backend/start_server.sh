#!/bin/bash

# Display IP address information
echo "Your IP addresses:"
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  ipconfig getifaddr en0  # WiFi
  ipconfig getifaddr en1  # Ethernet (if available)
else
  # Linux
  hostname -I
fi

# Run the production server
echo "Starting server..."
./run_production.sh