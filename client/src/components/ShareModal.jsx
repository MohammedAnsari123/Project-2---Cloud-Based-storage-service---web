import React, { useState } from 'react';
import { Copy, Mail, Share2, Link as LinkIcon, Check } from 'lucide-react';

const ShareModal = ({ isOpen, onClose, onShare, onGetLink, resourceName, resourceId, resourceType, token }) => {
    const [activeTab, setActiveTab] = useState('invite'); // 'invite' | 'link' | 'manage'
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [publicLink, setPublicLink] = useState('');
    const [copied, setCopied] = useState(false);
    const [sharedUsers, setSharedUsers] = useState([]);
    const [role, setRole] = useState('viewer'); // 'viewer' | 'editor'
    const [loadingUsers, setLoadingUsers] = useState(false);

    React.useEffect(() => {
        if (isOpen && activeTab === 'manage') {
            fetchSharedUsers();
        }
    }, [isOpen, activeTab]);

    const fetchSharedUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await fetch(`https://project-2-cloud-based-storage-service-web.onrender.com/api/shares/users?resourceId=${resourceId}&resourceType=${resourceType}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            console.log("Shared users fetched:", data); // Debug log
            setSharedUsers(data);
        } catch (error) {
            console.error("Fetch Users Error:", error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onShare(email, role);
        setLoading(false);
        setEmail('');
        setRole('viewer');
        alert("Invitation sent (if user exists)");
        // Switch to manage tab to show the new user potentially (if immediate fetch works, usually explicit refresh needed)
        // For now just stay on invite
    };

    // ... handleRoleChange ...

    // ... render ...

    {
        activeTab === 'invite' && (
            <form onSubmit={handleInvite}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="flex gap-2 mb-4">
                    <input
                        type="email"
                        placeholder="friend@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                    />
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                    </select>
                </div>
                <div className="text-xs text-gray-500 mb-4 bg-gray-100 p-2 rounded">
                    Note: This primarily works for existing users. Use "Public Link" for others.
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? 'Sending...' : 'Send Invitation'}
                </button>
            </form>
        )
    }

    const handleRoleChange = async (shareId, newRole) => {
        try {
            await fetch('https://project-2-cloud-based-storage-service-web.onrender.com/api/shares/role', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ shareId, role: newRole })
            });
            setSharedUsers(prev => prev.map(u => u.share_id === shareId ? { ...u, role: newRole } : u));
        } catch (error) {
            alert("Failed to update role");
        }
    };

    const handleRemoveAccess = async (shareId) => {
        if (!confirm("Remove access for this user?")) return;
        try {
            await fetch('https://project-2-cloud-based-storage-service-web.onrender.com/api/shares/remove', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ shareId })
            });
            setSharedUsers(prev => prev.filter(u => u.share_id !== shareId));
        } catch (error) {
            alert("Failed to remove access");
        }
    };

    if (!isOpen) return null;

    // ... existing link generation logic ...
    const handleGenerateLink = async () => {
        setLoading(true);
        try {
            const link = await onGetLink();
            setPublicLink(link);
        } catch (error) {
            console.error(error);
            alert("Failed to generate link");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(publicLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const sendViaGmail = () => {
        const subject = encodeURIComponent(`Sharing: ${resourceName}`);
        const body = encodeURIComponent(`Here is the link to the file/folder: ${publicLink}`);
        const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
        window.open(url, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gray-50 border-b px-6 py-4 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Share2 size={20} className="text-blue-600" />
                        Share "{resourceName}"
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'invite' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-600 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('invite')}
                    >
                        Invite
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'link' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-600 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('link')}
                    >
                        Public Link
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'manage' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-600 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('manage')}
                    >
                        Who has access
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 h-64 overflow-y-auto">
                    {activeTab === 'invite' && (
                        <form onSubmit={handleInvite}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="email"
                                    placeholder="friend@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="flex-1 border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                >
                                    <option value="viewer">Viewer</option>
                                    <option value="editor">Editor</option>
                                </select>
                            </div>
                            <div className="text-xs text-gray-500 mb-4 bg-gray-100 p-2 rounded">
                                Note: This primarily works for existing users. Use "Public Link" for others.
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'Sending...' : 'Send Invitation'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'link' && (
                        <div className="space-y-4">
                            {!publicLink ? (
                                <div className="text-center py-4">
                                    <p className="text-gray-600 text-sm mb-4">Generate a secure link to share this item with anyone.</p>
                                    <button
                                        onClick={handleGenerateLink}
                                        disabled={loading}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 flex items-center gap-2 mx-auto"
                                    >
                                        <LinkIcon size={18} />
                                        {loading ? 'Generating...' : 'Create Link'}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-gray-100 p-3 rounded-lg border border-gray-200 break-all text-sm text-gray-700 font-mono">
                                        {publicLink}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={copyToClipboard}
                                            className="flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700 font-medium"
                                        >
                                            {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                                            {copied ? 'Copied' : 'Copy Link'}
                                        </button>
                                        <button
                                            onClick={sendViaGmail}
                                            className="flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition font-medium"
                                        >
                                            <Mail size={18} />
                                            Gmail
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'manage' && (
                        <div>
                            {loadingUsers ? <div className="text-center text-gray-500 py-4">Loading users...</div> : (
                                sharedUsers.length === 0 ? <p className="text-gray-500 text-center py-4">Not shared with anyone yet.</p> : (
                                    <div className="space-y-3">
                                        {sharedUsers.map(user => (
                                            <div key={user.share_id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold uppercase">
                                                        {user.email[0]}
                                                    </div>
                                                    <div className="text-sm">
                                                        <div className="font-medium text-gray-800">{user.email}</div>
                                                        <div className="text-xs text-gray-500">Has access since {new Date(user.created_at).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleRoleChange(user.share_id, e.target.value)}
                                                        className="text-xs border border-gray-300 rounded px-2 py-1 outline-none"
                                                    >
                                                        <option value="viewer">Viewer</option>
                                                        <option value="editor">Editor</option>
                                                    </select>
                                                    <button onClick={() => handleRemoveAccess(user.share_id)} className="text-red-500 hover:text-red-700 text-xs px-2">
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
