import Chart from 'react-apexcharts';
import { Modal } from "../../components/ui/modal/index";
import Button from "../../components/ui/button/Button";

const AnalyticsModal = ({ isOpen, onClose, stats }) => {
    const {
        totalTransactions = 0,
        totalAmount = 0,
        totalNetAmount=0,
        totalCharges = 0,
        avgAmount = 0,
        depositCount = 0,
        withdrawalCount = 0
    } = stats || {};

    const successTransactions = Math.round(totalTransactions * 1); // Assuming 90% success rate
    const failedTransactions = Math.round(totalTransactions * 0); // Assuming 5% failed
    const pendingTransactions = totalTransactions - successTransactions - failedTransactions;

    // Adjust these calculations based on your actual data structure
    const totalDepositAmount = (depositCount * avgAmount);
    const totalWithdrawalAmount = withdrawalCount * avgAmount;

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
        }]
    };

    const statusChartSeries = [successTransactions, failedTransactions, pendingTransactions];

    // Transaction Type Chart
    const typeChartOptions = {
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
            categories: ['Deposits', 'Withdrawals'],
        },
        yaxis: {
            title: {
                text: 'Amount (₹)'
            }
        },
        fill: {
            opacity: 1
        },
        colors: ['#3B82F6', '#F59E0B'],
        tooltip: {
            y: {
                formatter: function (val) {
                    return "₹" + val.toFixed(2);
                }
            }
        }
    };

    const typeChartSeries = [{
        name: 'Total Amount',
        data: [totalDepositAmount, totalWithdrawalAmount]
    }, {
        name: 'Average Amount',
        data: [depositCount ? totalDepositAmount / depositCount : 0, 
               withdrawalCount ? totalWithdrawalAmount / withdrawalCount : 0]
    }];

    // Since we don't have daily data in stats, we'll create a simple mock
    // You should add daily aggregation to your backend if needed
    const dailyData = {
        dates: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'],
        deposits: [totalDepositAmount * 0.2, totalDepositAmount * 0.3, totalDepositAmount * 0.15, totalDepositAmount * 0.25, totalDepositAmount * 0.1],
        withdrawals: [totalWithdrawalAmount * 0.3, totalWithdrawalAmount * 0.2, totalWithdrawalAmount * 0.1, totalWithdrawalAmount * 0.25, totalWithdrawalAmount * 0.15]
    };

    const volumeChartOptions = {
        chart: {
            type: 'area',
            stacked: false,
            toolbar: {
                show: false
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth'
        },
        xaxis: {
            categories: dailyData.dates,
            labels: {
                rotate: -45
            }
        },
        yaxis: {
            title: {
                text: 'Amount (₹)'
            }
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                inverseColors: false,
                opacityFrom: 0.5,
                opacityTo: 0,
                stops: [0, 90, 100]
            },
        },
        colors: ['#3B82F6', '#F59E0B'],
        tooltip: {
            y: {
                formatter: function (val) {
                    return "₹" + val.toFixed(2);
                }
            }
        }
    };

    const volumeChartSeries = [{
        name: 'Deposits',
        data: dailyData.deposits
    }, {
        name: 'Withdrawals',
        data: dailyData.withdrawals
    }];

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[80vw] max-h-[99vh]">
            <div className="p-6 overflow-y-auto max-h-[99vh]">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                    Analytics
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
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            Total Transactions: {totalTransactions}
                        </div>
                    </div>

                    {/* Transaction Types */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">Transaction Types</h3>
                        <Chart
                            options={typeChartOptions}
                            series={typeChartSeries}
                            type="bar"
                            height={300}
                        />
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">Transaction Volume</h3>
                        <Chart
                            options={volumeChartOptions}
                            series={volumeChartSeries}
                            type="area"
                            height={300}
                        />
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Deposits</h4>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                            ₹{totalDepositAmount.toFixed(2)}
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-200">
                            {depositCount} transactions
                        </p>
                    </div>

                    <div className="bg-gray-100 dark:bg-pink-900/30 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">Total Charges</h4>
                        <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                            ₹{totalCharges.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-200">
                            {totalTransactions} transactions
                        </p>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">Total Withdrawals</h4>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-300">
                            ₹{totalWithdrawalAmount.toFixed(2)}
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-200">
                            {withdrawalCount} transactions
                        </p>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-green-800 dark:text-green-200">Success Rate</h4>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-300">
                            {totalTransactions ? ((successTransactions / totalTransactions) * 100).toFixed(1) : 0}%
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-200">
                            {successTransactions} successful transactions
                        </p>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200">Net Flow</h4>
                        <p className={`text-2xl font-bold ${
                            totalDepositAmount > totalWithdrawalAmount
                                ? 'text-green-600 dark:text-green-300'
                                : 'text-red-600 dark:text-red-300'
                            }`}>
                            ₹{(totalNetAmount).toFixed(2)}
                        </p>
                        <p className="text-sm text-purple-700 dark:text-purple-200">
                            {totalDepositAmount > totalWithdrawalAmount ? 'Inflow' : 'Outflow'}
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

export default AnalyticsModal;