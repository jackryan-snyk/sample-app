def is_palindrome(text: str) -> bool:
    """Return True if text reads the same forwards and backwards."""
    normalized = "".join(c.lower() for c in text if c.isalnum())
    return normalized == normalized[::-1]
