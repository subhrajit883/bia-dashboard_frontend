import React from 'react'

function NotFound() {
    return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
            <div className="max-w-md w-full text-center bg-white p-8 rounded-xl shadow-md">
                <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100">
                        <span className="text-5xl">😕</span>
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    404 - Page Not Found
                </h1>
                <p className="text-slate-500 text-lg mb-6">
                    We can't seem to find the page you're looking for.
                </p>

                <div className="space-y-4">
                    <p className="text-sm text-slate-400">
                        Maybe you mistyped the address? Or perhaps the page has been moved.
                    </p>

                    <div className="space-y-3">
                        <Link
                            to="/"
                            className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                        >
                            Go to Homepage
                        </Link>

                        <button
                            onClick={() => window.history.back()}
                            className="block w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-200 transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NotFound