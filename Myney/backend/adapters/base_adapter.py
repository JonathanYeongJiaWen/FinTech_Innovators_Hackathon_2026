from abc import ABC, abstractmethod
from entities.wealth_wallet_item import WealthWalletItem


class BaseAdapter(ABC):
    """
    Abstract base class that all data-source adapters must implement.
    Each adapter is responsible for fetching assets from one source,
    normalising them, and returning a list of WealthWalletItem objects.
    """

    @abstractmethod
    def fetch_assets(self, user_id: str) -> list[WealthWalletItem]:
        """
        Fetch and normalise assets for the given user_id.

        Args:
            user_id: The identifier of the user/client whose assets to retrieve.

        Returns:
            A list of WealthWalletItem instances representing each holding.
        """
        raise NotImplementedError

