import redis
from config import REDIS_HOST, REDIS_PORT, STREAM_NAME

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

def get_latest_sample():
    try:
        messages = r.xrevrange(STREAM_NAME, count=1)
    except:
        return None

    if not messages:
        return None

    _, data = messages[0]

    # Convert numeric fields except grade
    for key in data:
        if key != "grade":
            try:
                data[key] = float(data[key])
            except:
                pass

    return data
