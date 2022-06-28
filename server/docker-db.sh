# !/bin/bash

# Variables
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

if ! command -v docker &> /dev/null
then
    echo -e "${RED} docker could not be found"
    exit
fi

# Make sure no old containers are running
echo -e "${BLUE} Stopping old containers..."
docker stop project_m_db
docker rm project_m_db

# Create Container

if [ ! "$(docker ps -q -f name=project_m_db)" ]; then
    echo -e "Creating new container...${NC}"
    docker run -d --rm --name project_m_db                   \
        -e MYSQL_ROOT_PASSWORD=123456                    \
        -e MYSQL_USER=anji                               \
        -e MYSQL_PASSWORD=123456                         \
        -e MYSQL_DATABASE=test_db                        \
        -p 3309:3306                                     \
        --volume project_m_db:/var/lib/mysql             \
        mysql:latest
fi

# Check if container is up and running
if [ "$(docker inspect -f {{.State.Running}} project_m_db)" = "true" ]
then
		echo -e "${GREEN}project_m_db is running..."
		echo -e "Copy the following to your .env file:"
		echo -e "DATABASE_URL=\"mysql://anji:123456@localhost:3309/test_db\"${NC}" 
		echo -e "${RED}OR If you want to use Root: DATABASE_URL=\"mysql://root:123456@localhost:3309/test_db\"${NC}" 
		echo -e "Pushing DB Schema to DB..."
		npx prisma db push
else
		echo -e "${RED}project_m_db is not running!!"
		exit
fi
