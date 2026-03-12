import os
import redis


DEFAULT_STREAM_NAME = "grain_stream"


def _build_client():
    redis_url = os.getenv("REDIS_URL")

    if redis_url:
        return redis.Redis.from_url(redis_url, decode_responses=True)

    host = os.getenv("REDIS_HOST", "localhost")
    port = int(os.getenv("REDIS_PORT", "6379"))
    return redis.Redis(host=host, port=port, decode_responses=True)


r = _build_client()


def get_latest_sample(stream_name=DEFAULT_STREAM_NAME):
    try:
        messages = r.xrevrange(stream_name, count=1)
    except Exception:
        return None

    if not messages:
        return None

    _, data = messages[0]

    # Keep grade and language as strings; convert the rest when possible.
    for key in data:
        if key not in {"grade", "language"}:
            try:
                data[key] = float(data[key])
            except Exception:
                pass

    return data
