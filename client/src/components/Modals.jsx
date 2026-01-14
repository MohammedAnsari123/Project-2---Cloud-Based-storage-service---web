import React from 'react';

// Common Styles
const overlayStyle = "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm";
const modalStyle = "bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100";

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", isDangerous = false }) => {
    if (!isOpen) return null;

    return (
        <div className={overlayStyle} onClick={onClose}>
            <div className={modalStyle} onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-2 text-gray-800">{title}</h3>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`px-4 py-2 text-white rounded-lg shadow-sm transition-colors ${isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const InputModal = ({ isOpen, onClose, onSubmit, title, initialValue = "", placeholder = "" }) => {
    if (!isOpen) return null;
    const [value, setValue] = React.useState(initialValue);

    // Update internal state if initialValue changes (and when re-opened)
    React.useEffect(() => {
        setValue(initialValue);
    }, [initialValue, isOpen]);

    return (
        <div className={overlayStyle} onClick={onClose}>
            <div className={modalStyle} onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4 text-gray-800">{title}</h3>
                <form onSubmit={(e) => { e.preventDefault(); onSubmit(value); onClose(); }}>
                    <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        autoFocus
                    />
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
