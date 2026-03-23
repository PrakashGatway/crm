import Chart from 'react-apexcharts';
import { Modal } from "../../components/ui/modal/index";
import Button from "../../components/ui/button/Button";

const Analytics = ({ isOpen, onClose, stats }) => {
    const {
        totalTransactions = 0,
        totalAmount = 0,
        totalNetAmount = 0,
        totalCharges = 0,
        avgAmount = 0,
        successCount = 0,
        failCount = 0,
        pendingCount = 0
    } = stats || {};

    // Calculate derived values
    const successRate = totalTransactions ? (successCount / totalTransactions) * 100 : 0;
    const averageCharge = totalTransactions ? totalCharges / totalTransactions : 0;

    // Status Distribution Chart
    const statusChartOptions = {
        chart: {
            type: 'donut',
        },
        labels: ['Success', 'Failed', 'Pending'],
        colors: ['#10B981', '#EF4444', '#F59E0B'],
        legend: {
            position: 'bottom'
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: {
                    width: 200
                },
                legend: {
                    position: 'bottom'
                }
            }
        }],
        plotOptions: {
            pie: {
                donut: {
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Total',
                            formatter: () => totalTransactions
                        }
                    }
                }
            }
        }
    };

    const statusChartSeries = [successCount, failCount, pendingCount];

    // Transaction Summary Chart
    const summaryChartOptions = {
        chart: {
            type: 'bar',
            toolbar: {
                show: false
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                endingShape: 'rounded'
            },
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        xaxis: {
            categories: ['Amounts'],
        },
        yaxis: {
            title: {
                text: 'Amount (₹)'
            }
        },
        fill: {
            opacity: 1
        },
        colors: ['#3B82F6', '#10B981', '#EF4444'],
        tooltip: {
            y: {
                formatter: function (val) {
                    return "₹" + val.toFixed(2);
                }
            }
        }
    };

    const summaryChartSeries = [
        {
            name: 'Total Amount',
            data: [totalAmount]
        },
        {
            name: 'Net Amount',
            data: [totalNetAmount]
        },
        {
            name: 'Total Charges',
            data: [totalCharges]
        }
    ];

    // Daily mock data (would be replaced with actual daily data if available)
    const days = 7;
    const dailyData = {
        dates: Array.from({length: days}, (_, i) => `Day ${i+1}`),
        success: Array.from({length: days}, () => Math.floor(successCount/days * (0.5 + Math.random()))),
        fail: Array.from({length: days}, () => Math.floor(failCount/days * (0.5 + Math.random()))),
        pending: Array.from({length: days}, () => Math.floor(pendingCount/days * (0.5 + Math.random())))
    };

    const dailyChartOptions = {
        chart: {
            type: 'line',
            toolbar: {
                show: false
            }
        },
        stroke: {
            width: 2,
            curve: 'smooth'
        },
        xaxis: {
            categories: dailyData.dates,
        },
        yaxis: {
            title: {
                text: 'Transactions'
            }
        },
        colors: ['#10B981', '#EF4444', '#F59E0B'],
        legend: {
            position: 'top'
        },
        tooltip: {
            shared: true,
            intersect: false,
        }
    };

    const dailyChartSeries = [
        {
            name: 'Success',
            data: dailyData.success
        },
        {
            name: 'Failed',
            data: dailyData.fail
        },
        {
            name: 'Pending',
            data: dailyData.pending
        }
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[80vw] max-h-[99vh]">
            <div className="p-6 overflow-y-auto max-h-[99vh]">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                    Transaction Analytics
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Status Distribution */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">Transaction Status</h3>
                        <Chart
                            options={statusChartOptions}
                            series={statusChartSeries}
                            type="donut"
                            height={300}
                        />
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 grid grid-cols-3 gap-2">
                            <div className="text-green-600 dark:text-green-300">
                                Success: {successCount}
                            </div>
                            <div className="text-red-600 dark:text-red-300">
                                Failed: {failCount}
                            </div>
                            <div className="text-amber-600 dark:text-amber-300">
                                Pending: {pendingCount}
                            </div>
                        </div>
                    </div>

                    {/* Amount Summary */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">Amount Summary</h3>
                        <Chart
                            options={summaryChartOptions}
                            series={summaryChartSeries}
                            type="bar"
                            height={300}
                        />
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            Avg. Amount: ₹{avgAmount.toFixed(2)} | Avg. Charge: ₹{averageCharge.toFixed(2)}
                        </div>
                    </div>

                    {/* Daily Trend */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">Daily Trend</h3>
                        <Chart
                            options={dailyChartOptions}
                            series={dailyChartSeries}
                            type="line"
                            height={300}
                        />
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            Last {days} days transaction trend
                        </div>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Transactions</h4>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                            {totalTransactions}
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-200">
                            ₹{totalAmount.toFixed(2)} total amount
                        </p>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-green-800 dark:text-green-200">Success Rate</h4>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-300">
                            {successRate.toFixed(1)}%
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-200">
                            {successCount} successful transactions
                        </p>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200">Net Amount</h4>
                        <p className={`text-2xl font-bold ${
                            totalNetAmount >= 0
                                ? 'text-green-600 dark:text-green-300'
                                : 'text-red-600 dark:text-red-300'
                            }`}>
                            ₹{totalNetAmount.toFixed(2)}
                        </p>
                        <p className="text-sm text-purple-700 dark:text-purple-200">
                            After ₹{totalCharges.toFixed(2)} in charges
                        </p>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">Average Values</h4>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-300">
                            ₹{avgAmount.toFixed(2)}
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-200">
                            Per transaction | ₹{averageCharge.toFixed(2)} avg charge
                        </p>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button onClick={onClose}>
                        Close Analytics
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default Analytics;