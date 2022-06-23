# !/bin/bash

# Variables
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

if ! command -v docker &> /dev/null
then
    echo "${RED} docker could not be found"
    exit
fi

# Make sure no old containers are running
echo "${BLUE} Stopping old containers..."
docker stop project_m_db

# Create Container
echo "Creating new container...${NC}"
docker run -d --rm --name project_m_db \
        -e MYSQL_ROOT_PASSWORD=123456                    \
        -e MYSQL_USER=anji                               \
        -e MYSQL_PASSWORD=123456                         \
        -e MYSQL_DATABASE=test_db                        \
        -p 3309:3306                                     \
        --volume project_m_db:/var/lib/mysql  \
        mysql:latest

# Check if container is up and running
if [ "$(docker inspect -f {{.State.Running}} project_m_db)" = "true" ]
then
		echo "${GREEN}project_m_db is running..."
		echo "Copy the following to your .env file:"
		echo "DATABASE_URL=\"mysql://anji:123456@localhost:3309/test_db\"" 
		echo "Pushing DB Schema to DB..."
		npx prisma db push
else
		echo "${RED}project_m_db is not running!!"
		exit
fi
