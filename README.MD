- Build Image : docker build . -t @username/node-web-app
- Run Image : docker run -p 8080:8080 -d @username/node-web-app
- If build image error (https://github.com/docker/buildx/issues/426):
  - export DOCKER_BUILDKIT=0
  - export COMPOSE_DOCKER_CLI_BUILD=0
