import React from 'react'
import { Search, ListFilter } from 'lucide-react'

const Searchbar = () => {
    return (
        <div>
            <div className="mb-4 flex justify-center items-center gap-7">
                <div className="w-[80%] border border-black rounded-full flex justify-center items-center">
                    <input className='w-[100%] rounded-l-full px-5 py-[6px]' type="text" placeholder='Search Files' />
                    <button>
                        <Search size='35px' className='px-1 py-1' />
                    </button>
                </div>
                <div className="">
                    <button>
                        <ListFilter />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Searchbar
