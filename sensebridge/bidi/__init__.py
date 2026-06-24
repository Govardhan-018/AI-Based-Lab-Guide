def get_display(text: str) -> str:
    """Fallback implementation of ``bidi.get_display``.

    The real ``python-bidi`` package provides proper BiDi reordering for
    scripts such as Arabic or Hebrew. For the purposes of this application
    (EasyOCR on English text) a no‑op implementation is sufficient – it simply
    returns the input string unchanged.
    """
    return text

__all__ = ["get_display"]
