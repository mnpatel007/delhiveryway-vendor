// VendorSocketHandler.js - Legacy wrapper for backward compatibility
import { useSocket } from '../context/SocketContext';

const VendorSocketHandler = () => {
    const { incomingOrders } = useSocket();

    // The new socket context handles everything automatically
    // This component is kept for backward compatibility but does nothing
    // All socket functionality is now handled by the SocketContext

    return null;
};

export default VendorSocketHandler;
