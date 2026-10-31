from pathlib import Path
from typing import Any

import cv2 as cv
import zxingcpp as zx


def readout_barcode(img_pth:str|Path) -> dict[Any]|None:
	"""Loads image from filepath and tries to extract barcode information.
	
	Args:
        img_pth (str|Path): Filepath to image in which to search for a barcode.
	
    Returns:
        info (dic(Any)|None): If barcode was found: Object of type `zxingcpp.Barcode`, else `None`
	"""
	img_pth = Path(img_pth)
	if not img_pth.is_file():
		raise ValueError(f"{img_pth} must be a file.")
	img = cv.imread(img_pth) 
	if img is None:
		raise ValueError(f"Failed to read image from {img_pth}. Ensure file contains an image.")
	barcodes = zx.read_barcodes(img)
	if len(barcodes) > 1:
		raise IndexError(f"Found more than 1 barcode in image. Ensure only one is visible.")
	return barcodes[0] if barcodes else None


