from pydantic import BaseModel

class TryOnUserRequest(BaseModel):
    garment_id: int
    # TODO: Add file upload fields or URLs
