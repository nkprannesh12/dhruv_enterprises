import React, { useState, useRef } from 'react';
import { Plus, Trash2, Printer, Save, FileText, Percent } from 'lucide-react';
import signatureImage from './image_b545b8.png'; // Make sure this path is correct
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const BillingApp = () => {
    const [invoiceNumber, setInvoiceNumber] = useState(428);
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [billToParty, setBillToParty] = useState({ name: '', address: '', gstin: '', code: '' });
    const [shipToParty, setShipToParty] = useState({ name: '', address: '', gstin: '', code: '' });
    const [dcNo, setDcNo] = useState('');
    const [poNo, setPoNo] = useState('');
    const [vehicleNo, setVehicleNo] = useState('');
    // MODIFICATION 1: Add new state for E-way Bill Number
    const [eWayBillNo, setEWayBillNo] = useState(''); 
    const [items, setItems] = useState([{ id: 1, description: '', hsnCode: '', qty: 0, price: 0, amount: 0, unit: 'KG' }]);
    const [bankDetails, setBankDetails] = useState({ bankAc: '', bankIfsc: '', branch: '' });
    const [cgstRate, setCgstRate] = useState(9);
    const [sgstRate, setSgstRate] = useState(9);
    const [igstRate, setIgstRate] = useState(0);
    const [isSavingPdf, setIsSavingPdf] = useState(false);
    const invoiceRef = useRef();

    const handleTextareaResize = (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    const numberToWords = (num) => {
        if (num === 0) return 'Zero';
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const thousands = ['', 'Thousand', 'Lakh', 'Crore'];
        const convertGroup = (n) => {
            let result = '';
            if (n >= 100) { result += ones[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
            if (n >= 20) { result += tens[Math.floor(n / 10)] + ' '; n %= 10; }
            else if (n >= 10) { result += teens[n - 10] + ' '; return result; }
            if (n > 0) { result += ones[n] + ' '; }
            return result;
        };
        if (num < 0) return 'Negative ' + numberToWords(-num);
        let result = '';
        let groupIndex = 0;
        while (num > 0) {
            let group;
            if (groupIndex === 0) { group = num % 1000; num = Math.floor(num / 1000); }
            else { group = num % 100; num = Math.floor(num / 100); }
            if (group !== 0) { result = convertGroup(group) + thousands[groupIndex] + ' ' + result; }
            groupIndex++;
        }
        return result.trim() + ' Only';
    };
    
    const addItem = () => setItems([...items, { id: Date.now(), description: '', hsnCode: '', qty: 0, price: 0, amount: 0, unit: 'KG' }]);
    const removeItem = (id) => { if (items.length > 1) setItems(items.filter(item => item.id !== id)); };
    
    const updateItem = (id, field, value) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'qty' || field === 'price') {
                    const qty = field === 'qty' ? parseFloat(value) || 0 : item.qty;
                    const price = field === 'price' ? parseFloat(value) || 0 : item.price;
                    updatedItem.amount = qty * price;
                }
                return updatedItem;
            }
            return item;
        }));
    };
    
    const calculateTotals = () => {
        const subTotal = items.reduce((sum, item) => sum + item.amount, 0);
        const cgst = subTotal * (cgstRate / 100);
        const sgst = subTotal * (sgstRate / 100);
        const igst = subTotal * (igstRate / 100);
        const total = subTotal + cgst + sgst + igst;
        return { subTotal, cgst, sgst, igst, total };
    };
    
    const { subTotal, cgst, sgst, igst, total } = calculateTotals();

    const generateNewInvoice = () => {
        setInvoiceNumber(prev => prev + 1);
        setInvoiceDate(new Date().toISOString().split('T')[0]);
        setBillToParty({ name: '', address: '', gstin: '', code: '' });
        setShipToParty({ name: '', address: '', gstin: '', code: '' });
        setDcNo(''); setPoNo(''); setVehicleNo('');
        // MODIFICATION 2: Reset E-way Bill number on new invoice
        setEWayBillNo('');
        setItems([{ id: 1, description: '', hsnCode: '', qty: 0, price: 0, amount: 0, unit: 'KG' }]);
    };
    
    const handlePrint = () => window.print();

    const handleSaveAsPDF = () => {
        setIsSavingPdf(true);
        setTimeout(() => {
            html2canvas(invoiceRef.current, { scale: 2, windowWidth: invoiceRef.current.scrollWidth, windowHeight: invoiceRef.current.scrollHeight })
                .then((canvas) => {
                    const imageData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = pdf.internal.pageSize.getHeight();
                    const canvasWidth = canvas.width;
                    const canvasHeight = canvas.height;
                    const canvasAspectRatio = canvasWidth / canvasHeight;
                    const pdfAspectRatio = pdfWidth / pdfHeight;

                    let finalCanvasHeight, finalCanvasWidth;

                    if (canvasAspectRatio > pdfAspectRatio) {
                        finalCanvasWidth = pdfWidth;
                        finalCanvasHeight = pdfWidth / canvasAspectRatio;
                    } else {
                        finalCanvasHeight = pdfHeight;
                        finalCanvasWidth = pdfHeight * canvasAspectRatio;
                    }

                    pdf.addImage(imageData, 'PNG', 0, 0, finalCanvasWidth, finalCanvasHeight);
                    pdf.save(`invoice-${invoiceNumber}.pdf`);
                })
                .finally(() => {
                    setIsSavingPdf(false);
                });
        }, 300);
    };

    const copyShipToParty = () => setShipToParty({ ...billToParty });

    return (
        <>
            <style>
                {`@media print {@page { size: A4; margin: 1cm; } body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }}`}
            </style>
            <div className="min-h-screen bg-gray-100 p-2 sm:p-4">
                <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
                    {/* Header Controls */}
                    <div className="bg-blue-600 text-white p-4 print:hidden">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <h1 className="text-xl font-bold flex items-center gap-2 self-center"><FileText size={24} /> Worlex Enterprises - Billing System</h1>
                            <div className="grid grid-cols-1 sm:flex sm:flex-row gap-2 w-full sm:w-auto">
                                <button onClick={generateNewInvoice} className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded flex items-center justify-center gap-2"><Plus size={18} /> New Bill</button>
                                <button onClick={handlePrint} className="bg-sky-500 hover:bg-sky-600 px-4 py-2 rounded flex items-center justify-center gap-2"><Printer size={18} /> Print</button>
                                <button onClick={handleSaveAsPDF} className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded flex items-center justify-center gap-2"><Save size={18} /> Save as PDF</button>
                            </div>
                        </div>
                    </div>

                    <div ref={invoiceRef} className="p-4 sm:p-6 bg-white" id="invoice-content">
                        {/* Company and Invoice Details */}
                        <div className="border-2 border-black mb-4">
                            <div className="flex flex-col sm:flex-row">
                                <div className="flex-1 p-4 border-b-2 sm:border-b-0 sm:border-r-2 border-black">
                                    <h2 className="text-xl font-bold text-center mb-2">Worlex Enterprises</h2>
                                    <div className="text-sm space-y-1">
                                        <p>120 I, Bangalow Street, Neikarapatti (Po),</p>
                                        <p>Palani(Tk), Dindigul (Dt),Tamil Nadu.</p>
                                        <p>Cell : 8778489020</p>
                                        <p>e-mail : worlex.in@gmail.com</p>
                                        <p><strong>GST NO :</strong> 33EMUPK6767C1ZL</p>
                                        {/* MODIFICATION 3: Make the E-way Bill field an editable input */}
                                        <p>
                                            <strong>E-way Bill NO :</strong>
                                            {isSavingPdf ? (
                                                <span className="ml-2">{eWayBillNo}</span>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={eWayBillNo}
                                                    onChange={(e) => setEWayBillNo(e.target.value)}
                                                    className="ml-2 outline-none border-b w-40"
                                                    placeholder="Enter E-way Bill No"
                                                />
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="w-full sm:w-2/5 p-4">
                                    <h3 className="text-lg font-bold mb-4 text-center">TAX INVOICE</h3>
                                    <div className="text-sm space-y-2">
                                        <div className="flex justify-between items-center"><span className="font-bold">INVOICE NO :</span><span>{isSavingPdf ? invoiceNumber : <input type="number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="w-24 text-right outline-none border-b" />}</span></div>
                                        <div className="flex justify-between items-center"><span className="font-bold">INVOICE DATE :</span><span>{isSavingPdf ? new Date(invoiceDate).toLocaleDateString('en-GB') : <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="text-right outline-none border-b" />}</span></div>
                                        <div className="flex justify-between items-center"><span className="font-bold">DC NO :</span><span>{isSavingPdf ? dcNo : <input type="text" value={dcNo} onChange={(e) => setDcNo(e.target.value)} className="w-24 text-right outline-none border-b" />}</span></div>
                                        <div className="flex justify-between items-center"><span className="font-bold">PO NO :</span><span>{isSavingPdf ? poNo : <input type="text" value={poNo} onChange={(e) => setPoNo(e.target.value)} className="w-24 text-right outline-none border-b" />}</span></div>
                                        <div className="flex justify-between items-center"><span className="font-bold">VEHICLE NO:</span><span>{isSavingPdf ? vehicleNo : <input type="text" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} className="w-24 text-right outline-none border-b" />}</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bill To / Ship To */}
                        <div className="border-2 border-black mb-4">
                            <div className="flex bg-yellow-200">
                                <div className="flex-1 p-2 border-r border-black"><h4 className="font-bold text-center">BILL TO PARTY</h4></div>
                                <div className="flex-1 p-2"><h4 className="font-bold text-center">SHIP TO PARTY</h4></div>
                            </div>
                            <div className="flex flex-col sm:flex-row">
                                <div className="flex-1 p-4 border-b-2 sm:border-b-0 sm:border-r-2 border-black space-y-2">
                                    <div>
                                        <label className="text-xs font-semibold">Name:</label>
                                        {isSavingPdf ? 
                                            <p className="text-sm">{billToParty.name}</p> : 
                                            <input type="text" value={billToParty.name} onChange={(e) => setBillToParty({ ...billToParty, name: e.target.value })} className="w-full border-b outline-none" placeholder="Enter party name" />
                                        }
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold">Address:</label>
                                        {isSavingPdf ? 
                                            <p className="text-sm whitespace-pre-wrap">{billToParty.address}</p> : 
                                            <textarea value={billToParty.address} onChange={(e) => setBillToParty({ ...billToParty, address: e.target.value })} className="w-full border-b outline-none resize-none" rows="2" placeholder="Enter party address" />
                                        }
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold">GSTIN:</label>
                                        {isSavingPdf ? 
                                            <p className="text-sm">{billToParty.gstin}</p> : 
                                            <input type="text" value={billToParty.gstin} onChange={(e) => setBillToParty({ ...billToParty, gstin: e.target.value })} className="w-full border-b outline-none" placeholder="Enter GSTIN" />
                                        }
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold">CODE:</label>
                                        {isSavingPdf ? 
                                            <p className="text-sm">{billToParty.code}</p> : 
                                            <input type="text" value={billToParty.code} onChange={(e) => setBillToParty({ ...billToParty, code: e.target.value })} className="w-full border-b outline-none" placeholder="Enter State Code" />
                                        }
                                    </div>
                                </div>
                                <div className="flex-1 p-4 space-y-2">
                                    <div className="flex justify-end">
                                        <button onClick={copyShipToParty} className={isSavingPdf ? 'hidden' : "text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded print:hidden"}>Copy from Bill To</button>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold">Name:</label>
                                        {isSavingPdf ? 
                                            <p className="text-sm">{shipToParty.name}</p> : 
                                            <input type="text" value={shipToParty.name} onChange={(e) => setShipToParty({ ...shipToParty, name: e.target.value })} className="w-full border-b outline-none" placeholder="Enter party name" />
                                        }
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold">Address:</label>
                                        {isSavingPdf ? 
                                            <p className="text-sm whitespace-pre-wrap">{shipToParty.address}</p> : 
                                            <textarea value={shipToParty.address} onChange={(e) => setShipToParty({ ...shipToParty, address: e.target.value })} className="w-full border-b outline-none resize-none" rows="2" placeholder="Enter party address" />
                                        }
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold">GSTIN:</label>
                                        {isSavingPdf ? 
                                            <p className="text-sm">{shipToParty.gstin}</p> : 
                                            <input type="text" value={shipToParty.gstin} onChange={(e) => setShipToParty({ ...shipToParty, gstin: e.target.value })} className="w-full border-b outline-none" placeholder="Enter GSTIN" />
                                        }
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold">CODE:</label>
                                        {isSavingPdf ? 
                                            <p className="text-sm">{shipToParty.code}</p> : 
                                            <input type="text" value={shipToParty.code} onChange={(e) => setShipToParty({ ...shipToParty, code: e.target.value })} className="w-full border-b outline-none" placeholder="Enter State Code" />
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="border-2 border-black mb-4">
                            <table className="w-full">
                                <thead className="bg-yellow-200">
                                    <tr>
                                        <th className="border border-black p-2 text-sm w-12">S.No.</th>
                                        <th className="border border-black p-2 text-sm">Product Description</th>
                                        <th className="border border-black p-2 text-sm w-24">HSN CODE</th>
                                        <th className="border border-black p-2 text-sm w-32">QTY</th>
                                        <th className="border border-black p-2 text-sm w-24">PRICE</th>
                                        <th className="border border-black p-2 text-sm w-24">AMOUNT</th>
                                        {!isSavingPdf && <th className="border border-black p-2 text-sm print:hidden w-14">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={item.id} className="min-h-[44px]">
                                            <td className="border border-black p-2 text-center text-sm">{index + 1}</td>
                                            <td className="border border-black p-0 align-top">
                                                {isSavingPdf ?
                                                    <p className="p-2 text-sm break-words whitespace-pre-wrap">{item.description}</p> :
                                                    <textarea
                                                        value={item.description}
                                                        onChange={(e) => { updateItem(item.id, 'description', e.target.value); handleTextareaResize(e); }}
                                                        className="w-full h-full p-2 outline-none resize-none overflow-hidden"
                                                        rows="1"
                                                        placeholder="Product description" 
                                                    />
                                                }
                                            </td>
                                            <td className="border border-black p-0 text-center">
                                                {isSavingPdf ? <p className="p-2 text-sm">{item.hsnCode}</p> : <input type="text" value={item.hsnCode} onChange={(e) => updateItem(item.id, 'hsnCode', e.target.value)} className="w-full h-full p-2 outline-none text-center" placeholder="HSN" />}
                                            </td>
                                            <td className="border border-black p-0 text-center">
                                                {isSavingPdf ? (
                                                    <p className="p-2 text-sm">{`${item.qty} ${item.unit}`}</p>
                                                ) : (
                                                    <div className="flex items-stretch h-full">
                                                        <input
                                                            type="number"
                                                            value={item.qty}
                                                            onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                                                            className="w-full p-2 outline-none text-center"
                                                            placeholder="0"
                                                        />
                                                        <select
                                                            value={item.unit}
                                                            onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                                                            className="outline-none bg-gray-50 text-sm border-l border-gray-300 cursor-pointer pr-1"
                                                        >
                                                            <option value="KG">KG</option>
                                                            <option value="bundles">bundles</option>
                                                            <option value="ton">ton</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="border border-black p-0 text-right">
                                                {isSavingPdf ? <p className="p-2 text-sm">{parseFloat(item.price).toFixed(2)}</p> : <input type="number" step="0.01" value={item.price} onChange={(e) => updateItem(item.id, 'price', e.target.value)} className="w-full h-full p-2 outline-none text-right" placeholder="0.00" />}
                                            </td>
                                            <td className="border border-black p-2 text-right text-sm">{item.amount.toFixed(2)}</td>
                                            {!isSavingPdf && <td className="border border-black p-2 text-center print:hidden"><button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 disabled:opacity-50" disabled={items.length === 1}><Trash2 size={16} /></button></td>}
                                        </tr>
                                    ))}
                                    {Array.from({ length: Math.max(0, 10 - items.length) }).map((_, index) => (
                                        <tr key={`empty-${index}`} className="h-11"><td className="border border-black"></td><td className="border border-black"></td><td className="border border-black"></td><td className="border border-black"></td><td className="border border-black"></td><td className="border border-black"></td>{!isSavingPdf && <td className="border border-black print:hidden"></td>}</tr>
                                    ))}
                                </tbody>
                            </table>
                            {!isSavingPdf && <div className="flex print:hidden p-2 border-t border-black"><button onClick={addItem} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded flex items-center gap-2 text-sm"><Plus size={16} />Add Item</button></div>}
                        </div>

                        {/* Totals and Bank Details */}
                        <div className="flex flex-col md:flex-row border-2 border-black">
                            <div className="flex-1 p-4 border-b-2 md:border-b-0 md:border-r-2 border-black">
                                <h4 className="font-bold mb-2">BANK DETAILS</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2"><strong className="w-20">Bank A/C:</strong><span>{isSavingPdf ? bankDetails.bankAc : <input type="text" value={bankDetails.bankAc} onChange={(e) => setBankDetails({ ...bankDetails, bankAc: e.target.value })} className="w-full border-b" />}</span></div>
                                    <div className="flex items-center gap-2"><strong className="w-20">Bank IFSC:</strong><span>{isSavingPdf ? bankDetails.bankIfsc : <input type="text" value={bankDetails.bankIfsc} onChange={(e) => setBankDetails({ ...bankDetails, bankIfsc: e.target.value })} className="w-full border-b" />}</span></div>
                                    <div className="flex items-center gap-2"><strong className="w-20">Branch:</strong><span>{isSavingPdf ? bankDetails.branch : <input type="text" value={bankDetails.branch} onChange={(e) => setBankDetails({ ...bankDetails, branch: e.target.value })} className="w-full border-b" />}</span></div>
                                </div>
                                <h4 className="font-bold mt-4 mb-2">Terms & Conditions</h4>
                                <p className="text-xs">Subject to 'Dindigul' Jurisdiction</p>
                            </div>
                            <div className="w-full md:w-2/5">
                                <table className="w-full text-sm h-full">
                                    <tbody>
                                        <tr><td className="border-b border-black p-2 font-bold">Sub Total</td><td className="border-b border-black p-2 text-right">{subTotal.toFixed(2)}</td></tr>
                                        <tr><td className="border-b border-black p-2">CGST @{cgstRate}%</td><td className="border-b border-black p-2 text-right">{cgst.toFixed(2)}</td></tr>
                                        <tr><td className="border-b border-black p-2">SGST @{sgstRate}%</td><td className="border-b border-black p-2 text-right">{sgst.toFixed(2)}</td></tr>
                                        <tr><td className="border-b border-black p-2">IGST @{igstRate}%</td><td className="border-b border-black p-2 text-right">{igst.toFixed(2)}</td></tr>
                                        <tr><td className="p-2 font-bold bg-yellow-200">Total Amount</td><td className="p-2 text-right font-bold bg-yellow-200">{total.toFixed(2)}</td></tr>
                                        <tr><td className="p-2 font-bold border-t border-black" colSpan="2"><span className="text-xs">Amount in Words: </span><span className="text-xs font-normal">{numberToWords(Math.round(total))}</span></td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Signature */}
                        <div className="border-2 border-black border-t-0">
                            <div className="flex">
                                <div className="flex-1 p-4 border-r border-black text-center"><div className="h-24 flex items-end justify-center"><p className="font-bold text-sm">COMMON SEAL</p></div></div>
                                <div className="flex-1 p-4 text-center">
                                    <div className="h-24 flex flex-col justify-between">
                                        <div className="text-center text-xs p-1 border-b-2 border-black">Certified that the particulars given above are true and correct</div>
                                        <div><p className="font-bold text-sm">FOR: Worlex Enterprises</p></div>
                                        <div className="h-23 flex flex-col justify-end items-center"><img src={signatureImage} alt="Signature" className="h-5" /></div>
                                        <div><p className="font-bold text-sm">AUTHORIZED SIGNATORY</p></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="max-w-4xl mx-auto mt-4 p-4 bg-gray-800 text-white rounded-lg print:hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-gray-700 p-3 rounded-md">
                            <div className="flex items-center gap-2 mb-2"><Percent className="text-yellow-400" size={20} /><span className="font-semibold">Tax Rates:</span></div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex items-center gap-2 text-sm flex-1"><label htmlFor="cgst" className="font-medium w-12">CGST:</label><input id="cgst" type="number" value={cgstRate} onChange={e => setCgstRate(parseFloat(e.target.value) || 0)} className="w-full p-1 rounded bg-gray-600 text-white text-center" /><span>%</span></div>
                                <div className="flex items-center gap-2 text-sm flex-1"><label htmlFor="sgst" className="font-medium w-12">SGST:</label><input id="sgst" type="number" value={sgstRate} onChange={e => setSgstRate(parseFloat(e.target.value) || 0)} className="w-full p-1 rounded bg-gray-600 text-white text-center" /><span>%</span></div>
                                <div className="flex items-center gap-2 text-sm flex-1"><label htmlFor="igst" className="font-medium w-12">IGST:</label><input id="igst" type="number" value={igstRate} onChange={e => setIgstRate(parseFloat(e.target.value) || 0)} className="w-full p-1 rounded bg-gray-600 text-white text-center" /><span>%</span></div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-end gap-6 bg-gray-700 p-3 rounded-md">
                            <div className="text-sm"><span>Subtotal: </span><span className="font-bold">₹{subTotal.toFixed(2)}</span></div>
                            <div className="text-lg"><span className="font-semibold">TOTAL: </span><span className="font-bold text-yellow-400 text-xl">₹{total.toFixed(2)}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BillingApp;