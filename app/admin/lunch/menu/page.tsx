import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getFullMenu } from '@/lib/lunch-data'
import { formatRupiah } from '@/lib/lunch'
import LunchTabs from '../LunchTabs'
import {
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createAddOn,
  updateAddOn,
  deleteAddOn,
} from '../actions'

const inputClass = `w-full bg-white border border-slate-300 rounded-md text-slate-800
  text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400`

const fileClass = `w-full text-xs text-slate-500 file:mr-2 file:rounded-md file:border-0
  file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-slate-700`

const saveButton =
  'rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700'
const addButton =
  'rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50'
const deleteButton =
  'rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50'

function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      {children}
    </div>
  )
}

export default async function AdminLunchMenuPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    redirect('/dashboard')
  }

  const restaurants = await getFullMenu()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Lunch</h1>
        <p className="mt-1 text-sm text-slate-500">
          What students can order. Switching a restaurant or item off hides it
          from <span className="font-mono">/lunch</span> immediately without
          touching orders already placed. Prices are whole rupiah.
        </p>
      </div>

      <LunchTabs />

      {/* Add a restaurant */}
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-medium text-slate-900">Add a restaurant</h2>
        <form action={createRestaurant} className="flex flex-wrap items-end gap-2">
          <Field label="Name" className="min-w-[180px] flex-1">
            <input name="name" required placeholder="Warung Bu Tini" className={inputClass} />
          </Field>
          <Field label="Description" className="min-w-[200px] flex-[2]">
            <input name="description" placeholder="Indonesian home cooking" className={inputClass} />
          </Field>
          <Field label="Order" className="w-[72px]">
            <input name="sortOrder" type="number" defaultValue={0} className={inputClass} />
          </Field>
          <Field label="Photo" className="w-[190px]">
            <input name="image" type="file" accept="image/*" className={fileClass} />
          </Field>
          <button type="submit" className={addButton}>
            Add restaurant
          </button>
        </form>
      </section>

      {restaurants.length === 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          No restaurants yet. If you have not run{' '}
          <span className="font-mono">
            supabase/migrations/20260728_lunch_ordering.sql
          </span>{' '}
          in the Supabase SQL Editor, do that first — nothing on this page can
          save without it.
        </div>
      )}

      {restaurants.map((restaurant) => (
        <section
          key={restaurant.id}
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-5"
        >
          {/* Restaurant header + edit */}
          <div className="flex flex-wrap items-end gap-2">
            <form
              action={updateRestaurant}
              className="flex flex-1 flex-wrap items-end gap-2"
            >
              <input type="hidden" name="id" value={restaurant.id} />
              {restaurant.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={restaurant.imageUrl}
                  alt=""
                  className="h-[42px] w-[42px] rounded-md border border-slate-200 object-cover"
                />
              )}
              <Field label="Restaurant" className="min-w-[160px] flex-1">
                <input name="name" defaultValue={restaurant.name} required className={inputClass} />
              </Field>
              <Field label="Description" className="min-w-[180px] flex-[2]">
                <input
                  name="description"
                  defaultValue={restaurant.description ?? ''}
                  className={inputClass}
                />
              </Field>
              <Field label="Order" className="w-[72px]">
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={restaurant.sortOrder}
                  className={inputClass}
                />
              </Field>
              <Field label="Replace photo" className="w-[170px]">
                <input name="image" type="file" accept="image/*" className={fileClass} />
              </Field>
              <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
                <input
                  name="isActive"
                  type="checkbox"
                  defaultChecked={restaurant.isActive}
                  className="h-4 w-4"
                />
                Visible
              </label>
              <button type="submit" className={saveButton}>
                Save
              </button>
            </form>

            <form action={deleteRestaurant}>
              <input type="hidden" name="id" value={restaurant.id} />
              <button type="submit" className={deleteButton}>
                Remove
              </button>
            </form>
          </div>

          {/* Menu items */}
          <div className="space-y-3 border-t border-slate-200 pt-4">
            {(restaurant.menuItems ?? []).length === 0 ? (
              <p className="text-sm text-slate-400">No menu items yet.</p>
            ) : (
              (restaurant.menuItems ?? []).map((item) => (
                <div key={item.id} className="rounded-md border border-slate-200 p-3">
                  <div className="flex flex-wrap items-end gap-2">
                    <form
                      action={updateMenuItem}
                      className="flex flex-1 flex-wrap items-end gap-2"
                    >
                      <input type="hidden" name="id" value={item.id} />
                      {item.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="h-[42px] w-[42px] rounded-md border border-slate-200 object-cover"
                        />
                      )}
                      <Field label="Item" className="min-w-[150px] flex-1">
                        <input name="name" defaultValue={item.name} required className={inputClass} />
                      </Field>
                      <Field label="Description" className="min-w-[160px] flex-[2]">
                        <input
                          name="description"
                          defaultValue={item.description ?? ''}
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Price (Rp)" className="w-[120px]">
                        <input
                          name="price"
                          type="number"
                          min={0}
                          defaultValue={item.price}
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Order" className="w-[72px]">
                        <input
                          name="sortOrder"
                          type="number"
                          defaultValue={item.sortOrder}
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Replace photo" className="w-[170px]">
                        <input name="image" type="file" accept="image/*" className={fileClass} />
                      </Field>
                      <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
                        <input
                          name="isActive"
                          type="checkbox"
                          defaultChecked={item.isActive}
                          className="h-4 w-4"
                        />
                        Visible
                      </label>
                      <button type="submit" className={saveButton}>
                        Save
                      </button>
                    </form>

                    <form action={deleteMenuItem}>
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" className={deleteButton}>
                        Remove
                      </button>
                    </form>
                  </div>

                  {/* Add-ons for this item */}
                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 pl-4">
                    <p className="text-xs font-medium text-slate-500">
                      Add-ons {item.addOns.length > 0 && `(${item.addOns.length})`}
                    </p>

                    {item.addOns.map((addOn) => (
                      <div key={addOn.id} className="flex flex-wrap items-end gap-2">
                        <form
                          action={updateAddOn}
                          className="flex flex-1 flex-wrap items-end gap-2"
                        >
                          <input type="hidden" name="id" value={addOn.id} />
                          <Field label="Add-on" className="min-w-[140px] flex-1">
                            <input
                              name="name"
                              defaultValue={addOn.name}
                              required
                              className={inputClass}
                            />
                          </Field>
                          <Field label="Price (Rp)" className="w-[120px]">
                            <input
                              name="price"
                              type="number"
                              min={0}
                              defaultValue={addOn.price}
                              className={inputClass}
                            />
                          </Field>
                          <Field label="Order" className="w-[72px]">
                            <input
                              name="sortOrder"
                              type="number"
                              defaultValue={addOn.sortOrder}
                              className={inputClass}
                            />
                          </Field>
                          <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
                            <input
                              name="isActive"
                              type="checkbox"
                              defaultChecked={addOn.isActive}
                              className="h-4 w-4"
                            />
                            Visible
                          </label>
                          <button type="submit" className={saveButton}>
                            Save
                          </button>
                        </form>

                        <form action={deleteAddOn}>
                          <input type="hidden" name="id" value={addOn.id} />
                          <button type="submit" className={deleteButton}>
                            Delete
                          </button>
                        </form>
                      </div>
                    ))}

                    <form action={createAddOn} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="menuItemId" value={item.id} />
                      <Field label="New add-on" className="min-w-[140px] flex-1">
                        <input name="name" placeholder="Extra rice" required className={inputClass} />
                      </Field>
                      <Field label="Price (Rp)" className="w-[120px]">
                        <input name="price" type="number" min={0} defaultValue={0} className={inputClass} />
                      </Field>
                      <button type="submit" className={addButton}>
                        Add add-on
                      </button>
                    </form>
                  </div>
                </div>
              ))
            )}

            {/* Add a menu item */}
            <form
              action={createMenuItem}
              className="flex flex-wrap items-end gap-2 border-t border-slate-200 pt-3"
            >
              <input type="hidden" name="restaurantId" value={restaurant.id} />
              <Field label="New item" className="min-w-[150px] flex-1">
                <input name="name" placeholder="Nasi Goreng Spesial" required className={inputClass} />
              </Field>
              <Field label="Description" className="min-w-[160px] flex-[2]">
                <input name="description" placeholder="With fried egg and crackers" className={inputClass} />
              </Field>
              <Field label="Price (Rp)" className="w-[120px]">
                <input name="price" type="number" min={0} defaultValue={0} className={inputClass} />
              </Field>
              <Field label="Photo" className="w-[170px]">
                <input name="image" type="file" accept="image/*" className={fileClass} />
              </Field>
              <button type="submit" className={addButton}>
                Add item
              </button>
            </form>
          </div>

          <p className="text-xs text-slate-400">
            {(restaurant.menuItems ?? []).length} item
            {(restaurant.menuItems ?? []).length === 1 ? '' : 's'}
            {(restaurant.menuItems ?? []).length > 0 &&
              ` · from ${formatRupiah(
                Math.min(...(restaurant.menuItems ?? []).map((i) => i.price))
              )}`}
          </p>
        </section>
      ))}
    </div>
  )
}
