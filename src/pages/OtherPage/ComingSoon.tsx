import GridShape from "../../components/common/GridShape";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";

export default function ComingSoon() {
    return (
        <>
            <PageMeta
                title="Coming Soon | Gateway Abroad - React.js Admin Dashboard Template"
                description="Exciting new features are coming soon to Gateway Abroad - React.js Tailwind CSS Admin Dashboard Template"
            />
            <div className="h-full flex flex-col items-center justify-center p-6 overflow-hidden z-1">
                <div className="mx-auto mt-8 w-full max-w-[420px] text-center sm:max-w-[580px]">
                <GridShape />
                    <div className="">
                        <img
                            src="https://media.tenor.com/exjpMhe7gwkAAAAi/rushing-hurry.gif"
                            alt="Coming Soon"
                            className="dark:hidden mx-auto max-w-full h-auto"
                        />
                        <img
                            src="https://media.tenor.com/exjpMhe7gwkAAAAi/rushing-hurry.gif"
                            alt="Coming Soon"
                            className="hidden dark:block mx-auto max-w-full h-auto"
                        />
                    </div>
                    <h1 className="mb-3 font-bold text-gray-800 text-title-md dark:text-white/90">
                        COMING SOON
                    </h1>

                    <p className="mb-6 text-base text-gray-700 dark:text-gray-400 sm:text-lg">
                        We're working hard to bring you something amazing. Stay tuned!
                    </p>

                    <Link
                        to="/"
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                    >
                        Back to Home Page
                    </Link>
                </div>
            </div>
        </>
    );
}