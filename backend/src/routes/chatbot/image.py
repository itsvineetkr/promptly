# from io import BytesIO
# import asyncio
# import aiohttp
# import cv2
# from transformers import BlipProcessor, BlipForConditionalGeneration
# from PIL import Image


# class ImageCaptioning:
#     def __init__(self):
#         self.processor = BlipProcessor.from_pretrained(
#             "Salesforce/blip-image-captioning-base", use_fast=True
#         )
#         self.model = BlipForConditionalGeneration.from_pretrained(
#             "Salesforce/blip-image-captioning-base"
#         )

#     async def load_image_from_url(self, image_url, session=None):
#         if session is None:
#             session = aiohttp.ClientSession()

#         async with session.get(image_url) as response:
#             content = await response.read()
#         image = Image.open(BytesIO(content)).convert("RGB")
#         return image

#     async def generate_caption(self, image, session=None):
#         if isinstance(image, str):
#             image = await self.load_image_from_url(image, session)
#         elif not isinstance(image, cv2.typing.MatLike):
#             raise ValueError("Unsupported image type. Provide a URL or an image.")

#         inputs = self.processor(images=image, return_tensors="pt")
#         caption_ids = await asyncio.to_thread(
#             self.model.generate,
#             **inputs,
#             repetition_penalty=1.5,
#             temperature=0.6,
#         )

#         caption = self.processor.decode(caption_ids[0], skip_special_tokens=True)
#         return caption
    