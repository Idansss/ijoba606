'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, BookOpen, Hash, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface GlossaryTerm {
  id: string;
  code?: string; // Tax code reference
  term: string;
  definition: string;
  category: string;
  keywords: string[]; // For search
  relatedTerms?: string[]; // IDs of related terms
  effectiveDate?: string;
  source?: string;
}

// Sample glossary data - Replace with actual Nigeria Tax Law 2026 data
const glossaryData: GlossaryTerm[] = [
  {
    id: '1',
    code: 'CITA Section 1',
    term: 'Personal Income Tax',
    definition: 'Tax charged on the income of individuals, partnerships, and communities. In Nigeria, this is governed by the Personal Income Tax Act (PITA) and includes PAYE (Pay As You Earn) deductions.',
    category: 'Tax Types',
    keywords: ['PITA', 'income tax', 'individual tax', 'PAYE'],
    effectiveDate: '2026-01-01',
    source: 'Personal Income Tax Act (PITA) 2026',
  },
  {
    id: '2',
    code: 'PITA Section 3',
    term: 'PAYE (Pay As You Earn)',
    definition: 'A system of income tax collection where employers deduct tax from employees\' salaries or wages at the point of payment. The deducted amount is remitted to the Federal Inland Revenue Service (FIRS) on behalf of the employee.',
    category: 'Tax Collection',
    keywords: ['PAYE', 'withholding', 'salary deduction', 'employer deduction'],
    relatedTerms: ['1', '3'],
    effectiveDate: '2026-01-01',
    source: 'Personal Income Tax Act (PITA) 2026',
  },
  {
    id: '3',
    code: 'PITA Schedule 1',
    term: 'Personal Allowance',
    definition: 'A tax-free amount that individuals can earn before income tax is applied. For the 2026 tax year, the personal allowance is ₦200,000 per annum.',
    category: 'Allowances & Reliefs',
    keywords: ['allowance', 'tax-free', 'exemption', 'relief'],
    relatedTerms: ['2', '4'],
    effectiveDate: '2026-01-01',
    source: 'Personal Income Tax Act (PITA) 2026',
  },
  {
    id: '4',
    code: 'PITA Section 20',
    term: 'Tax Relief',
    definition: 'Reductions in taxable income granted to taxpayers for specific expenses or circumstances. Common reliefs include pension contributions, National Housing Fund (NHF), and life insurance premiums.',
    category: 'Allowances & Reliefs',
    keywords: ['relief', 'deduction', 'pension', 'NHF', 'insurance'],
    relatedTerms: ['3', '5'],
    effectiveDate: '2026-01-01',
    source: 'Personal Income Tax Act (PITA) 2026',
  },
  {
    id: '5',
    code: 'PITA Section 21',
    term: 'National Housing Fund (NHF)',
    definition: 'A mandatory contribution scheme where employees contribute 2.5% of their monthly basic salary to the National Housing Fund. This contribution is tax-deductible.',
    category: 'Allowances & Reliefs',
    keywords: ['NHF', 'housing', 'contribution', '2.5%', 'deductible'],
    relatedTerms: ['4'],
    effectiveDate: '2026-01-01',
    source: 'Personal Income Tax Act (PITA) 2026',
  },
  {
    id: '6',
    code: 'PITA Schedule 2',
    term: 'Tax Brackets',
    definition: 'Progressive tax rate structure where different income ranges are taxed at different rates. For 2026: First ₦300,000 at 7%, Next ₦300,000 at 11%, Next ₦500,000 at 15%, Next ₦500,000 at 19%, Next ₦1,600,000 at 21%, Above ₦3,200,000 at 24%.',
    category: 'Tax Rates',
    keywords: ['brackets', 'rates', 'progressive tax', 'income ranges'],
    relatedTerms: ['3'],
    effectiveDate: '2026-01-01',
    source: 'Personal Income Tax Act (PITA) 2026',
  },
  {
    id: '7',
    code: 'PITA Section 10',
    term: 'Taxable Income',
    definition: 'The portion of an individual\'s income that is subject to taxation after deducting all allowable expenses, reliefs, and personal allowance.',
    category: 'Tax Calculation',
    keywords: ['taxable', 'income', 'calculation', 'deductions'],
    relatedTerms: ['3', '4', '6'],
    effectiveDate: '2026-01-01',
    source: 'Personal Income Tax Act (PITA) 2026',
  },
  {
    id: '8',
    code: 'PITA Section 15',
    term: 'Gross Income',
    definition: 'Total income earned by an individual before any deductions, allowances, or taxes are applied. This includes salary, bonuses, allowances, and other emoluments.',
    category: 'Tax Calculation',
    keywords: ['gross', 'total income', 'before tax', 'emoluments'],
    relatedTerms: ['7'],
    effectiveDate: '2026-01-01',
    source: 'Personal Income Tax Act (PITA) 2026',
  },
  {
    id: '9',
    code: 'PITA Section 8',
    term: 'FIRS (Federal Inland Revenue Service)',
    definition: 'The government agency responsible for assessing, collecting, and accounting for all types of taxes in Nigeria, including personal income tax and PAYE.',
    category: 'Tax Administration',
    keywords: ['FIRS', 'revenue service', 'tax authority', 'collection'],
    effectiveDate: '2026-01-01',
    source: 'Personal Income Tax Act (PITA) 2026',
  },
  {
    id: '10',
    code: 'PITA Section 12',
    term: 'Tax Clearance Certificate (TCC)',
    definition: 'A certificate issued by FIRS confirming that a taxpayer has fulfilled all tax obligations for a specified period. Required for various transactions including government contracts and travel.',
    category: 'Tax Administration',
    keywords: ['TCC', 'clearance', 'certificate', 'compliance'],
    relatedTerms: ['9'],
    effectiveDate: '2026-01-01',
    source: 'Personal Income Tax Act (PITA) 2026',
  },
];

const categories = ['All', ...Array.from(new Set(glossaryData.map(term => term.category)))];

export default function GlossaryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());

  const filteredTerms = useMemo(() => {
    return glossaryData.filter(term => {
      const matchesSearch = 
        term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.keywords.some(kw => kw.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'All' || term.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const toggleExpand = (id: string) => {
    setExpandedTerms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mb-4">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Nigeria Tax Law 2026 Glossary
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Comprehensive guide to tax terms, codes, and definitions from the Personal Income Tax Act (PITA) 2026
        </p>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-6 mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by term, code, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600">
          Found <span className="font-semibold text-purple-600">{filteredTerms.length}</span> term{filteredTerms.length !== 1 ? 's' : ''}
        </div>
      </motion.div>

      {/* Glossary Terms */}
      <div className="space-y-4">
        {filteredTerms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-2xl shadow-lg"
          >
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 text-lg">No terms found matching your search</p>
            <p className="text-gray-500 text-sm mt-2">Try different keywords or select a different category</p>
          </motion.div>
        ) : (
          filteredTerms.map((term, index) => (
            <motion.div
              key={term.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <button
                onClick={() => toggleExpand(term.id)}
                className="w-full p-6 text-left hover:bg-gray-50 transition-colors flex items-start justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{term.term}</h3>
                    {term.code && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                        <Hash className="w-4 h-4" />
                        {term.code}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                      {term.category}
                    </span>
                    {term.effectiveDate && (
                      <span className="text-gray-500">
                        Effective: {new Date(term.effectiveDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {expandedTerms.has(term.id) ? (
                    <div className="mt-3">
                      <p className="text-gray-700 leading-relaxed">{term.definition}</p>
                      {term.source && (
                        <p className="text-sm text-gray-500 mt-2 italic">Source: {term.source}</p>
                      )}
                      {term.relatedTerms && term.relatedTerms.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-gray-700 mb-1">Related Terms:</p>
                          <div className="flex flex-wrap gap-2">
                            {term.relatedTerms.map(relatedId => {
                              const relatedTerm = glossaryData.find(t => t.id === relatedId);
                              return relatedTerm ? (
                                <span
                                  key={relatedId}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                                >
                                  {relatedTerm.term}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600 line-clamp-2">{term.definition}</p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {expandedTerms.has(term.id) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* Info Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-12 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 text-center"
      >
        <p className="text-gray-700 mb-2">
          <strong>Note:</strong> This glossary is for educational purposes only and should not be considered as legal or tax advice.
        </p>
        <p className="text-sm text-gray-600">
          For official tax guidance, consult the Federal Inland Revenue Service (FIRS) or a qualified tax professional.
        </p>
      </motion.div>
    </div>
  );
}
