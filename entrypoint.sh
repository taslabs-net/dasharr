#!/bin/sh

# Set PUID/PGID defaults
PUID=${PUID:-1000}
PGID=${PGID:-1000}

echo "Starting with UID: $PUID, GID: $PGID"

# Get the user name for this UID (might already exist)
USER_NAME=$(getent passwd $PUID | cut -d: -f1 || echo "")

# If no user exists with this UID, create one
if [ -z "$USER_NAME" ]; then
    # Create group if needed
    if ! getent group $PGID >/dev/null 2>&1; then
        addgroup -g $PGID appgroup
    fi
    
    # Create user
    adduser -D -u $PUID -G $(getent group $PGID | cut -d: -f1) appuser
    USER_NAME="appuser"
fi

echo "Running as user: $USER_NAME"

# Fix ownership of the app directory (excluding node_modules for speed)
find /app -maxdepth 1 -not -name node_modules -exec chown $PUID:$PGID {} \;

# Create config directory if it doesn't exist
if [ ! -d "/app/config" ]; then
    mkdir -p /app/config
fi

# Always fix permissions on config directory
chown -R $PUID:$PGID /app/config 2>/dev/null || true
chmod -R 755 /app/config 2>/dev/null || true

# Configure TLS certificate validation
# By default, require valid certificates for security
# Set DASHARR_ALLOW_SELF_SIGNED=true to accept self-signed certificates
if [ "${DASHARR_ALLOW_SELF_SIGNED:-false}" = "true" ]; then
    echo "Warning: Self-signed certificates will be accepted (DASHARR_ALLOW_SELF_SIGNED=true)"
    export NODE_TLS_REJECT_UNAUTHORIZED=0
else
    # Ensure proper certificate validation is enabled (default secure behavior)
    export NODE_TLS_REJECT_UNAUTHORIZED=1
fi

# Execute the startup script as the specified user
exec su-exec $PUID:$PGID "$@"