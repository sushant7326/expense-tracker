sudo systemctl start postgresql.service
# open postgres
sudo -i -u postgres
# access PostgreSQL Prompt
psql

# or do the two steps in one simple process
# psql -U postgres

# Exit PostgreSQL Prompt
# \q

# Create a User
# CREATE USER user_name WITH PASSWORD 'password';

# List Users
# \du

# List Databases
# \l

# Create a Database
# CREATE DATABASE database_name;

# Connect to a Database
# \c database_name

# List Tables
# \dt