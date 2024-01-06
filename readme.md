```bash
docker buildx create --use
docker buildx build --push --platform linux/arm64,linux/amd64 -t alexkramer98/hass-notifier .
```
