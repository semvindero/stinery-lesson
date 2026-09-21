import React, { useState, useEffect, useRef } from 'react';

// Твой реальный адрес бэкенда на Railway
const API_URL = 'https://stinery-lesson-production.up.railway.app';

export default function App() {
    const [subjectsData, setSubjectsData] = useState({});
    const [activeSubject, setActiveSubject] = useState('history');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Модальное окно добавления параграфа
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newTime, setNewTime] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Модальное окно добавления предмета
    const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
    const [newSubjectKey, setNewSubjectKey] = useState('');
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectAdminKey, setNewSubjectAdminKey] = useState('');
    const [subjectError, setSubjectError] = useState('');

    const textRef = useRef(null);

    // Модальное окно чтения полного текста
    const [selectedParagraph, setSelectedParagraph] = useState(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const res = await fetch(`${API_URL}/api/subjects`);
            const data = await res.json();
            setSubjectsData(data);
            const keys = Object.keys(data);
            if (keys.length > 0 && !data[activeSubject]) {
                setActiveSubject(keys[0]);
            }
            setLoading(false);
        } catch (err) {
            console.error('Ошибка загрузки данных:', err);
            setLoading(false);
        }
    };

    const handleAddParagraph = async (e) => {
        e.preventDefault();
        const textValue = textRef.current ? textRef.current.value : '';
        if (!newTitle || !textValue || !activeSubject) return;

        setErrorMsg('');

        try {
            const res = await fetch(`${API_URL}/api/subjects/${activeSubject}/paragraphs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': adminPassword
                },
                body: JSON.stringify({
                    title: newTitle,
                    time: newTime || '3 мин',
                    text: textValue
                })
            });

            if (res.ok) {
                setNewTitle('');
                setNewTime('');
                setAdminPassword('');
                if (textRef.current) textRef.current.value = '';
                setIsModalOpen(false);
                fetchSubjects();
            } else {
                const errData = await res.json();
                setErrorMsg(errData.error || 'Неверный пароль администратора!');
            }
        } catch (err) {
            console.error('Ошибка сети:', err);
            setErrorMsg('Ошибка соединения с сервером');
        }
    };

    // Функция создания нового предмета
    const handleCreateSubject = async (e) => {
        e.preventDefault();
        setSubjectError('');

        try {
            const response = await fetch(`${API_URL}/api/subjects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: newSubjectKey,
                    name: newSubjectName,
                    adminKey: newSubjectAdminKey
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Ошибка при создании предмета');
            }

            setNewSubjectKey('');
            setNewSubjectName('');
            setNewSubjectAdminKey('');
            setIsAddSubjectOpen(false);
            fetchSubjects();
        } catch (err) {
            setSubjectError(err.message);
        }
    };

    // Функция удаления параграфа
    const handleDeleteParagraph = async (paragraphId, e) => {
        e.stopPropagation();

        const password = prompt('Введите секретный ключ администратора для удаления:');
        if (!password) return;

        try {
            const res = await fetch(`${API_URL}/api/subjects/${activeSubject}/paragraphs/${paragraphId}`, {
                method: 'DELETE',
                headers: {
                    'x-admin-token': password
                }
            });

            if (res.ok) {
                fetchSubjects();
            } else {
                const errData = await res.json();
                alert(errData.error || 'Неверный пароль!');
            }
        } catch (err) {
            console.error('Ошибка сети:', err);
            alert('Ошибка соединения с сервером');
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#faf9f5] text-neutral-500 font-sans">
                Загрузка материалов...
            </div>
        );
    }

    const currentSubject = subjectsData[activeSubject] || { name: '', title: '', description: '', paragraphs: [] };

    const filteredParagraphs = (currentSubject.paragraphs || []).filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.text.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-[#faf9f5] text-neutral-900 font-sans selection:bg-neutral-200">

            {/* Боковая навигация */}
            <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-neutral-200 flex flex-col md:fixed md:h-screen p-6 z-10">
                <div className="flex items-center gap-3 mb-6 md:mb-8 px-2">
                    <div className="w-7 h-7 bg-neutral-900 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                        9
                    </div>
                    <div>
                        <h1 className="font-semibold text-sm leading-tight">9 Класс</h1>
                        <p className="text-xs text-neutral-500">Краткие содержания</p>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-2 px-2">
                    <span className="text-[11px] font-medium tracking-wider text-neutral-400 uppercase">
                        Предметы
                    </span>
                    <button
                        onClick={() => { setIsAddSubjectOpen(true); setSubjectError(''); }}
                        className="text-xs text-neutral-500 hover:text-neutral-900 font-medium cursor-pointer"
                        title="Добавить предмет"
                    >
                        + Предмет
                    </button>
                </div>

                <ul className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                    {Object.entries(subjectsData).map(([key, data]) => (
                        <li key={key} className="shrink-0">
                            <button
                                onClick={() => { setActiveSubject(key); setSearchQuery(''); }}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${activeSubject === key
                                        ? 'bg-neutral-100 font-medium text-neutral-900'
                                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                                    }`}
                            >
                                {data.name}
                            </button>
                        </li>
                    ))}
                </ul>

                <div className="mt-auto hidden md:block pt-4 border-t border-neutral-100 space-y-2">
                    <button
                        onClick={() => { setIsAddSubjectOpen(true); setSubjectError(''); }}
                        className="w-full py-2 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-medium transition-colors text-center cursor-pointer"
                    >
                        + Создать предмет
                    </button>
                    <button
                        onClick={() => { setIsModalOpen(true); setErrorMsg(''); }}
                        className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition-colors text-center shadow-sm cursor-pointer"
                    >
                        + Добавить параграф
                    </button>
                </div>
            </aside>

            {/* Кнопка добавления для мобильных */}
            <div className="md:hidden p-4 bg-white border-b border-neutral-200 flex gap-2">
                <button
                    onClick={() => { setIsAddSubjectOpen(true); setSubjectError(''); }}
                    className="flex-1 py-2.5 px-3 bg-neutral-100 text-neutral-800 rounded-lg text-xs font-medium text-center cursor-pointer"
                >
                    + Предмет
                </button>
                <button
                    onClick={() => { setIsModalOpen(true); setErrorMsg(''); }}
                    className="flex-1 py-2.5 px-3 bg-neutral-900 text-white rounded-lg text-xs font-medium text-center shadow-sm cursor-pointer"
                >
                    + Параграф
                </button>
            </div>

            {/* Основная часть */}
            <main className="md:ml-64 flex-1 p-6 md:p-10 max-w-5xl w-full">
                <div className="mb-8">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={`Поиск по предмету "${currentSubject.name || ''}"...`}
                        className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-400 transition-colors shadow-sm placeholder:text-neutral-400"
                    />
                </div>

                <div className="mb-8">
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900 mb-1">{currentSubject.title}</h2>
                    <p className="text-sm text-neutral-500">{currentSubject.description}</p>
                </div>

                {/* Сетка карточек */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredParagraphs.length > 0 ? (
                        filteredParagraphs.map((par) => (
                            <div key={par.id} className="bg-white border border-neutral-200/80 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative group">
                                <div>
                                    <div className="flex justify-between items-start gap-3 mb-2">
                                        <h3 className="font-semibold text-neutral-900">{par.title}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md whitespace-nowrap">
                                                {par.time}
                                            </span>
                                            {/* Кнопка удаления */}
                                            <button
                                                onClick={(e) => handleDeleteParagraph(par.id, e)}
                                                title="Удалить параграф"
                                                className="text-neutral-300 hover:text-red-500 text-sm font-light px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-neutral-600 leading-relaxed mb-6 line-clamp-3">{par.text}</p>
                                </div>

                                <button
                                    onClick={() => { setSelectedParagraph(par); setIsFullScreen(false); }}
                                    className="text-xs font-medium text-neutral-700 hover:text-black flex items-center gap-1 group self-start cursor-pointer"
                                >
                                    <span>Читать полностью</span>
                                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center text-neutral-400 text-sm bg-white border border-dashed border-neutral-200 rounded-2xl">
                            Ничего не найдено
                        </div>
                    )}
                </div>
            </main>

            {/* Модальное окно чтения */}
            {selectedParagraph && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 p-2 md:p-4">
                    <div className={`bg-white border border-neutral-200 rounded-2xl w-full p-6 shadow-2xl flex flex-col transition-all duration-300 ${isFullScreen ? 'h-screen max-w-none rounded-none' : 'max-w-2xl max-h-[90vh]'
                        }`}>
                        <div className="flex justify-between items-start gap-4 mb-4 pb-3 border-b border-neutral-100">
                            <div>
                                <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md mb-2 inline-block">
                                    Время чтения: ~ {selectedParagraph.time}
                                </span>
                                <h3 className="text-lg md:text-xl font-bold text-neutral-900 leading-snug">{selectedParagraph.title}</h3>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsFullScreen(!isFullScreen)}
                                    title={isFullScreen ? "Свернуть" : "На весь экран"}
                                    className="text-neutral-400 hover:text-neutral-700 text-sm px-2 py-1 rounded border border-neutral-200 bg-neutral-50 transition-colors cursor-pointer"
                                >
                                    {isFullScreen ? '🗗' : '🗖'}
                                </button>
                                <button
                                    onClick={() => { setSelectedParagraph(null); setIsFullScreen(false); }}
                                    className="text-neutral-400 hover:text-neutral-700 text-xl leading-none p-1 cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto pr-2 my-2 text-base text-neutral-800 leading-relaxed whitespace-pre-wrap flex-1">
                            {selectedParagraph.text}
                        </div>

                        <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-end">
                            <button
                                onClick={() => { setSelectedParagraph(null); setIsFullScreen(false); }}
                                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            >
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно добавления параграфа */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-neutral-200 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-semibold text-neutral-900">Добавить в {currentSubject.name}</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-neutral-400 hover:text-neutral-700 text-lg leading-none p-1 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleAddParagraph} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-600 mb-1">Название</label>
                                <input
                                    type="text"
                                    required
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="Параграф 4. Название"
                                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-400 text-neutral-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-600 mb-1">Время чтения</label>
                                <input
                                    type="text"
                                    value={newTime}
                                    onChange={(e) => setNewTime(e.target.value)}
                                    placeholder="3 мин"
                                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-400 text-neutral-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-600 mb-1">Содержание</label>
                                <textarea
                                    required
                                    rows="4"
                                    ref={textRef}
                                    placeholder="Полный текст параграфа..."
                                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-400 resize-none text-neutral-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-600 mb-1">Секретный ключ администратора</label>
                                <input
                                    type="password"
                                    required
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    placeholder="Введите пароль..."
                                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-400 text-neutral-900"
                                />
                            </div>

                            {errorMsg && (
                                <div className="text-xs text-red-500 font-medium bg-red-50 p-2 rounded-lg border border-red-100">
                                    {errorMsg}
                                </div>
                            )}

                            <div className="flex gap-2.5 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                                >
                                    Сохранить
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Модальное окно добавления предмета */}
            {isAddSubjectOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-neutral-200 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-semibold text-neutral-900">Создать новый предмет</h3>
                            <button
                                onClick={() => setIsAddSubjectOpen(false)}
                                className="text-neutral-400 hover:text-neutral-700 text-lg leading-none p-1 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubject} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-600 mb-1">Системный ключ (латиницей, напр. physics)</label>
                                <input
                                    type="text"
                                    required
                                    value={newSubjectKey}
                                    onChange={(e) => setNewSubjectKey(e.target.value)}
                                    placeholder="physics"
                                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-400 text-neutral-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-600 mb-1">Название предмета</label>
                                <input
                                    type="text"
                                    required
                                    value={newSubjectName}
                                    onChange={(e) => setNewSubjectName(e.target.value)}
                                    placeholder="Физика"
                                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-400 text-neutral-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-600 mb-1">Админ-ключ для предмета</label>
                                <input
                                    type="password"
                                    required
                                    value={newSubjectAdminKey}
                                    onChange={(e) => setNewSubjectAdminKey(e.target.value)}
                                    placeholder="Секретный пароль..."
                                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-400 text-neutral-900"
                                />
                            </div>

                            {subjectError && (
                                <div className="text-xs text-red-500 font-medium bg-red-50 p-2 rounded-lg border border-red-100">
                                    {subjectError}
                                </div>
                            )}

                            <div className="flex gap-2.5 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddSubjectOpen(false)}
                                    className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                                >
                                    Создать
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}