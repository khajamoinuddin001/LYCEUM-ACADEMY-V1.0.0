import sys

with open("src/features/university/university_application_view.tsx", "r") as f:
    lines = f.readlines()

new_lines = lines[:185] + [
'''                    <div className="w-full overflow-x-auto bg-white dark:bg-[#1a1d24] rounded-2xl border border-gray-100 dark:border-gray-800/60 shadow-sm">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-[#1e2330]/50 border-b border-gray-100 dark:border-gray-800/60 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                    <th className="px-6 py-4 font-extrabold rounded-tl-2xl">ACK Number</th>
                                    <th className="px-6 py-4 font-extrabold">Applicant</th>
                                    <th className="px-6 py-4 font-extrabold">University & Course</th>
                                    <th className="px-6 py-4 font-extrabold">Submission Date</th>
                                    <th className="px-6 py-4 font-extrabold">Status</th>
                                    <th className="px-6 py-4 font-extrabold text-right rounded-tr-2xl">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/40">
                                {filteredApps.map((item, i) => {
                                    const statusColorClass = getStatusColor(item.app.status);
                                    
                                    return (
                                        <tr 
                                            key={`${item.student.id}-${item.idx}`}
                                            className="group hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                                            onClick={() => setSelectedApp(item)}
                                        >
                                            <td className="px-6 py-4">
                                                {item.app.ackNumber ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-extrabold text-xs tracking-widest text-lyceum-blue uppercase">
                                                            {item.app.ackNumber}
                                                        </span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(item.app.ackNumber || ''); }}
                                                            className="text-gray-300 hover:text-lyceum-blue transition-colors outline-none"
                                                            title="Copy ACK"
                                                        >
                                                            <Copy size={12} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300 dark:text-gray-600 text-xs">-</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.student.name}</span>
                                                    <span className="text-[11px] text-gray-500 truncate mt-0.5">{item.student.email}</span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex flex-col min-w-0 max-w-[250px] lg:max-w-xs">
                                                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate" title={item.app.universityName}>
                                                        {item.app.universityName}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 truncate mt-0.5">
                                                        <School size={10} className="shrink-0" />
                                                        <span className="truncate" title={item.app.course}>{item.app.course}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                                                    <Calendar size={12} className="text-gray-400" />
                                                    {item.app.applicationSubmissionDate ? new Date(item.app.applicationSubmissionDate).toLocaleDateString() : 'N/A'}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className={`inline-flex px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${statusColorClass} items-center gap-1.5`}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />
                                                    {item.app.status}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedApp(item); }}
                                                    className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 group-hover:text-lyceum-blue group-hover:bg-lyceum-blue/10 transition-colors"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
'''
] + lines[298:]

with open("src/features/university/university_application_view.tsx", "w") as f:
    f.writelines(new_lines)

print("Updated table successfully!")
