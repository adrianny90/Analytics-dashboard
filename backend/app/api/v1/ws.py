from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.market_service import market_service
from app.websocket.manager import ws_manager

router = APIRouter()


@router.websocket("/prices")
async def prices_ws(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            message = await websocket.receive_json()
            if message.get("action") == "subscribe":
                for symbol in message.get("symbols", []):
                    market_service.track_symbol(symbol)
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
