import { useState } from 'react';

const ApproverSelector = ({ users, approvers, setApprovers, isSequential }) => {
    const [selectedUser, setSelectedUser] = useState('');

    const addApprover = () => {
        if (!selectedUser) return;
        const user = users.find(u => u.id === selectedUser);
        if (!user) return;
        if (approvers.find(a => a.approver_id === user.id)) return; // avoid duplicates

        const nextStep = isSequential ? approvers.length + 1 : 1;
        setApprovers([...approvers, { approver_id: user.id, step_order: nextStep, user }]);
        setSelectedUser('');
    };

    const removeApprover = (id) => {
        const updated = approvers
            .filter(a => a.approver_id !== id)
            .map((a, idx) => ({ ...a, step_order: isSequential ? idx + 1 : 1 }));
        setApprovers(updated);
    };

    const moveUp = (index) => {
        if (index === 0) return;
        const updated = [...approvers];
        [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
        setApprovers(updated.map((a, i) => ({ ...a, step_order: i + 1 })));
    };

    const moveDown = (index) => {
        if (index === approvers.length - 1) return;
        const updated = [...approvers];
        [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
        setApprovers(updated.map((a, i) => ({ ...a, step_order: i + 1 })));
    };

    const roleColor = {
        admin: 'bg-purple-100 text-purple-700',
        manager: 'bg-blue-100 text-blue-700',
        employee: 'bg-green-100 text-green-700',
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <select
                    value={selectedUser}
                    onChange={e => setSelectedUser(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">-- Select Approver --</option>
                    {users.map(u => (
                        <option key={u.id} value={u.id}>
                            {u.name} ({u.role})
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={addApprover}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                >
                    Add
                </button>
            </div>

            {approvers.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                {isSequential && <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Step</th>}
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Name</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Role</th>
                                {isSequential && <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500">Order</th>}
                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {approvers.map((a, idx) => (
                                <tr key={a.approver_id} className="hover:bg-gray-50 transition">
                                    {isSequential && (
                                        <td className="px-3 py-2 font-bold text-indigo-600">#{a.step_order}</td>
                                    )}
                                    <td className="px-3 py-2 font-medium text-gray-800">{a.user?.name}</td>
                                    <td className="px-3 py-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleColor[a.user?.role] || 'bg-gray-100 text-gray-600'}`}>
                                            {a.user?.role}
                                        </span>
                                    </td>
                                    {isSequential && (
                                        <td className="px-3 py-2 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button type="button" onClick={() => moveUp(idx)} className="text-gray-400 hover:text-gray-700 px-1" title="Move Up">↑</button>
                                                <button type="button" onClick={() => moveDown(idx)} className="text-gray-400 hover:text-gray-700 px-1" title="Move Down">↓</button>
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-3 py-2 text-right">
                                        <button
                                            type="button"
                                            onClick={() => removeApprover(a.approver_id)}
                                            className="text-red-400 hover:text-red-600 text-xs font-medium"
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {approvers.length === 0 && (
                <p className="text-sm text-gray-400 italic">No approvers added yet.</p>
            )}
        </div>
    );
};

export default ApproverSelector;
